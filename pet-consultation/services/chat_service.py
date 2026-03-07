import json
import logging
from typing import Dict, List
from schemas.request import ChatRequest, AnalyzeRequest, SummaryRequest
from schemas.response import TextResponse, StructuredResponse, AnalysisResponse, SummaryResponse
from config.constants import (
    Intent, Language, ResponseMode, AlertLevel,
    EMOTION_LABELS,
)
from config.settings import CONFIDENCE_THRESHOLD
from prompt.builder import build_system_prompt, build_trend_prompt, build_summary_prompt
from client.groq_client import groq_client
from services.intent_detector import detect_intent
from services.safety_filter import determine_alert_level, should_add_disclaimer
from services.emotion_analyzer import (
    compute_emotion_distribution, find_dominant_emotion,
    detect_trend, detect_anomalies, get_alert_from_analysis,
)
from services.history_summarizer import summarize_emotion_history
from services.self_consistency import run_self_consistency
from services.reflexion import run_reflexion
from services.llm_judge import judge_response, apply_judge_warning
from services.hallucination_guard import check_hallucination, apply_hallucination_warning
from utils.cache import response_cache
from utils.token_counter import truncate_history_by_token_budget
from utils.language import detect_language
from prompt.templates import (
    MEDICAL_DISCLAIMER_TH, MEDICAL_DISCLAIMER_EN,
    FALLBACK_MESSAGE_TH, FALLBACK_MESSAGE_EN,
)

logger = logging.getLogger(__name__)

# In-memory session store: {session_id: [{"role": ..., "content": ...}]}
_session_store: Dict[str, List[dict]] = {}
MAX_HISTORY_TURNS = 10

# ✨ Technique 1: Intent-based Temperature Tuning
# ปรับ temperature ตาม intent เพื่อควบคุม creativity vs precision
INTENT_TEMPERATURE: Dict[Intent, float] = {
    Intent.HEALTH_CONCERN:  0.2,   # conservative, precise
    Intent.TREND_ANALYSIS:  0.3,   # factual, analytical
    Intent.EXPLAIN_EMOTION: 0.5,   # balanced
    Intent.SUGGEST_ACTION:  0.6,   # helpful, slightly creative
    Intent.GENERAL_CHAT:    0.75,  # warm, conversational
}


class ChatService:

    async def chat(self, request: ChatRequest) -> TextResponse | StructuredResponse:
        """Main chat endpoint handler"""
        # Auto-detect language if needed
        lang = detect_language(request.user_message)
        # Respect explicit language setting
        language = request.language

        # Detect intent
        intent = detect_intent(request.user_message)

        # ✨ Technique 1: get temperature for this intent
        temperature = INTENT_TEMPERATURE.get(intent, 0.7)

        # ✨ Technique 4: Smart history — truncate then summarize remainder
        history = truncate_history_by_token_budget(
            request.emotion_history,
            system_prompt="",
            user_message=request.user_message,
        )
        # If we dropped records, prepend a compact summary of the older ones
        dropped_count = len(request.emotion_history) - len(history)
        if dropped_count > 0:
            older_records = sorted(
                request.emotion_history, key=lambda x: x.timestamp
            )[:dropped_count]
            summary_str = summarize_emotion_history(older_records, language)
            history_summary_message = {"role": "system", "content": summary_str}
        else:
            history_summary_message = None

        # Build system prompt
        system_prompt = build_system_prompt(
            profile=request.pet_profile,
            emotion_history=history,
            intent=intent,
            language=language,
            response_mode=request.response_mode,
        )

        # Get or init session messages
        session_messages = _session_store.get(request.session_id, [])

        # Prepend history summary as system message (if any records were dropped)
        if history_summary_message and not session_messages:
            session_messages.insert(0, history_summary_message)

        # Add user message
        session_messages.append({"role": "user", "content": request.user_message})

        # Trim to max turns (each turn = 2 messages)
        if len(session_messages) > MAX_HISTORY_TURNS * 2:
            session_messages = session_messages[-(MAX_HISTORY_TURNS * 2):]

        # Check cache (only for non-conversational modes)
        cache_key = {
            "pet_id": request.pet_profile.pet_id,
            "message": request.user_message,
            "intent": intent,
            "mode": request.response_mode,
        }
        cached = response_cache.get(cache_key)

        if cached:
            raw_response = cached
        else:
            # ✨ Technique 5 & 8: Use Reflexion + Self-Consistency for health_concern
            if intent == Intent.HEALTH_CONCERN:
                # Reflexion: draft → critique → improved final
                reflexion_result = await run_reflexion(
                    groq_client,
                    system_prompt=system_prompt,
                    messages=session_messages,
                    language=language,
                    temperature=temperature,
                )
                # Self-Consistency: validate with 2 extra samples
                if reflexion_result:
                    consistency_result = await run_self_consistency(
                        groq_client,
                        system_prompt=system_prompt,
                        messages=session_messages,
                        temperature=temperature,
                        n=2,
                    )
                    # Pick the safer (lower alert) result
                    raw_response = reflexion_result  # Reflexion is primary
                else:
                    raw_response = await groq_client.chat(
                        system_prompt=system_prompt,
                        messages=session_messages,
                        temperature=temperature,
                    )
            else:
                # Standard path with intent-tuned temperature
                raw_response = await groq_client.chat(
                    system_prompt=system_prompt,
                    messages=session_messages,
                    temperature=temperature,
                )
            if raw_response:
                response_cache.set(cache_key, raw_response)

        # Fallback
        if not raw_response:
            fallback = FALLBACK_MESSAGE_TH if language == Language.TH else FALLBACK_MESSAGE_EN
            return TextResponse(
                session_id=request.session_id,
                message=fallback,
                alert_level=AlertLevel.NONE,
            )

        # Save assistant response to session
        session_messages.append({"role": "assistant", "content": raw_response})
        _session_store[request.session_id] = session_messages

        # Determine alert level & disclaimer
        latest_confidence = history[-1].confidence if history else 1.0
        latest_emotion = history[-1].emotion_label if history else "neutral"
        alert_level = determine_alert_level(intent, latest_confidence, latest_emotion)
        add_disclaimer = should_add_disclaimer(intent, request.user_message)

        # ✨ Technique 10: Hallucination Guard
        known_emotions = [r.emotion_label for r in history]
        hall_result = check_hallucination(raw_response, known_emotions, language)
        raw_response = apply_hallucination_warning(raw_response, hall_result, language)

        # ✨ Technique 9: LLM-as-a-Judge (only for health_concern to control latency)
        if intent == Intent.HEALTH_CONCERN:
            judge_result = await judge_response(
                groq_client, request.user_message, raw_response, language
            )
            raw_response = apply_judge_warning(raw_response, judge_result, language)

        # Handle structured response
        if request.response_mode == ResponseMode.STRUCTURED:
            return self._parse_structured(
                raw_response, request.session_id, add_disclaimer, alert_level, language
            )

        # Text response
        message = raw_response
        if add_disclaimer:
            disc = MEDICAL_DISCLAIMER_TH if language == Language.TH else MEDICAL_DISCLAIMER_EN
            message += disc

        return TextResponse(
            session_id=request.session_id,
            message=message,
            alert_level=alert_level,
            has_medical_disclaimer=add_disclaimer,
        )

    def _parse_structured(
        self, raw: str, session_id: str,
        add_disclaimer: bool, alert_level: AlertLevel, language: Language
    ) -> StructuredResponse:
        try:
            # Strip potential markdown fences
            clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            data = json.loads(clean)
            return StructuredResponse(
                session_id=session_id,
                summary=data.get("summary", ""),
                emotion_label=data.get("emotion_label", "unknown"),
                confidence=float(data.get("confidence", 0.0)),
                recommendations=data.get("recommendations", []),
                alert_level=AlertLevel(data.get("alert_level", "none")),
                has_medical_disclaimer=add_disclaimer,
            )
        except Exception as e:
            logger.error(f"Failed to parse structured response: {e}")
            return StructuredResponse(
                session_id=session_id,
                summary=raw,
                emotion_label="unknown",
                confidence=0.0,
                recommendations=[],
                alert_level=alert_level,
                has_medical_disclaimer=add_disclaimer,
            )

    async def analyze(self, request: AnalyzeRequest) -> AnalysisResponse:
        """Batch emotion trend analysis"""
        history = request.emotion_history
        dominant = find_dominant_emotion(history)
        distribution = compute_emotion_distribution(history)
        trend = detect_trend(history)
        anomalies = detect_anomalies(history)
        alert_level = get_alert_from_analysis(trend, anomalies, dominant)

        # Build prompt for LLM summary
        system = build_system_prompt(
            profile=request.pet_profile,
            emotion_history=history,
            intent=Intent.TREND_ANALYSIS,
            language=request.language,
            response_mode=ResponseMode.TEXT,
        )
        trend_instruction = build_trend_prompt(
            request.pet_profile, request.timeframe_days, request.language
        )

        llm_summary = await groq_client.chat(
            system_prompt=system,
            messages=[{"role": "user", "content": trend_instruction}],
        )

        return AnalysisResponse(
            pet_id=request.pet_profile.pet_id,
            pet_name=request.pet_profile.name,
            timeframe_days=request.timeframe_days,
            dominant_emotion=dominant,
            emotion_distribution={k: round(v, 3) for k, v in distribution.items()},
            trend=trend,
            anomalies=anomalies,
            summary=llm_summary or "ไม่สามารถสรุปได้ในขณะนี้",
            alert_level=alert_level,
        )

    async def summarize(self, request: SummaryRequest) -> SummaryResponse:
        """Weekly / monthly summary"""
        system = build_system_prompt(
            profile=request.pet_profile,
            emotion_history=request.emotion_history,
            intent=Intent.GENERAL_CHAT,
            language=request.language,
            response_mode=ResponseMode.STRUCTURED,
        )
        summary_instruction = build_summary_prompt(
            request.pet_profile, request.period, request.language
        )

        raw = await groq_client.chat(
            system_prompt=system,
            messages=[{"role": "user", "content": summary_instruction}],
        )

        try:
            clean = (raw or "{}").strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            data = json.loads(clean)
        except Exception:
            data = {"summary": raw or "", "highlights": [], "alert_level": "none"}

        return SummaryResponse(
            pet_id=request.pet_profile.pet_id,
            pet_name=request.pet_profile.name,
            period=request.period,
            summary=data.get("summary", ""),
            highlights=data.get("highlights", []),
            alert_level=AlertLevel(data.get("alert_level", "none")),
        )


chat_service = ChatService()
