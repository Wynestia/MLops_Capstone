from typing import List, Optional
from schemas.request import PetProfile, EmotionRecord
from config.constants import Intent, Language, ResponseMode
from config.settings import CONFIDENCE_THRESHOLD
from prompt.templates import (
    SYSTEM_BASE_TH, SYSTEM_BASE_EN,
    CURRENT_EMOTION_TH, CURRENT_EMOTION_EN,
    EMOTION_HISTORY_TH, EMOTION_HISTORY_EN,
    INTENT_EXPLAIN_TH, INTENT_EXPLAIN_EN,
    INTENT_SUGGEST_TH, INTENT_SUGGEST_EN,
    INTENT_HEALTH_TH, INTENT_HEALTH_EN,
    INTENT_GENERAL_TH, INTENT_GENERAL_EN,
    INTENT_TREND_TH, INTENT_TREND_EN,
    STRUCTURED_OUTPUT_INSTRUCTION_TH, STRUCTURED_OUTPUT_INSTRUCTION_EN,
    UNCERTAINTY_NOTE_TH, UNCERTAINTY_NOTE_EN,
    TREND_ANALYSIS_PROMPT_TH, TREND_ANALYSIS_PROMPT_EN,
    SUMMARY_PROMPT_TH, SUMMARY_PROMPT_EN,
)
from prompt.persona import build_pet_persona


INTENT_INSTRUCTIONS_TH = {
    Intent.EXPLAIN_EMOTION: INTENT_EXPLAIN_TH,
    Intent.SUGGEST_ACTION: INTENT_SUGGEST_TH,
    Intent.HEALTH_CONCERN: INTENT_HEALTH_TH,
    Intent.GENERAL_CHAT: INTENT_GENERAL_TH,
    Intent.TREND_ANALYSIS: INTENT_TREND_TH,
}

INTENT_INSTRUCTIONS_EN = {
    Intent.EXPLAIN_EMOTION: INTENT_EXPLAIN_EN,
    Intent.SUGGEST_ACTION: INTENT_SUGGEST_EN,
    Intent.HEALTH_CONCERN: INTENT_HEALTH_EN,
    Intent.GENERAL_CHAT: INTENT_GENERAL_EN,
    Intent.TREND_ANALYSIS: INTENT_TREND_EN,
}


def build_system_prompt(
    profile: PetProfile,
    emotion_history: List[EmotionRecord],
    intent: Intent,
    language: Language = Language.TH,
    response_mode: ResponseMode = ResponseMode.TEXT,
) -> str:
    parts = []

    # 1. Base system instruction
    parts.append(SYSTEM_BASE_TH if language == Language.TH else SYSTEM_BASE_EN)

    # 2. Pet persona
    parts.append(build_pet_persona(profile, language))

    # 3. Current emotion (latest record)
    if emotion_history:
        latest = sorted(emotion_history, key=lambda x: x.timestamp, reverse=True)[0]
        uncertainty_note = ""
        if latest.confidence < CONFIDENCE_THRESHOLD:
            note_tmpl = UNCERTAINTY_NOTE_TH if language == Language.TH else UNCERTAINTY_NOTE_EN
            uncertainty_note = note_tmpl.format(confidence=latest.confidence)

        emotion_tmpl = CURRENT_EMOTION_TH if language == Language.TH else CURRENT_EMOTION_EN
        parts.append(emotion_tmpl.format(
            emotion_label=latest.emotion_label,
            confidence=latest.confidence,
            uncertainty_note=uncertainty_note,
        ))

    # 4. Emotion history (last N records)
    if len(emotion_history) > 1:
        sorted_history = sorted(emotion_history, key=lambda x: x.timestamp, reverse=True)[:10]
        lines = [
            f"  - {r.timestamp.strftime('%Y-%m-%d %H:%M')} | {r.emotion_label} ({r.confidence:.0%})"
            for r in sorted_history
        ]
        hist_tmpl = EMOTION_HISTORY_TH if language == Language.TH else EMOTION_HISTORY_EN
        parts.append(hist_tmpl.format(n=len(lines), history_lines="\n".join(lines)))

    # 5. Intent-specific instruction
    intent_map = INTENT_INSTRUCTIONS_TH if language == Language.TH else INTENT_INSTRUCTIONS_EN
    instruction = intent_map.get(intent, "")
    if instruction:
        parts.append(f"\n=== คำสั่ง ===" if language == Language.TH else "\n=== Instruction ===")
        parts.append(instruction.format(name=profile.name))

    # 6. Structured output instruction
    if response_mode == ResponseMode.STRUCTURED:
        parts.append(
            STRUCTURED_OUTPUT_INSTRUCTION_TH if language == Language.TH
            else STRUCTURED_OUTPUT_INSTRUCTION_EN
        )

    return "\n".join(parts)


def build_trend_prompt(
    profile: PetProfile,
    timeframe_days: int,
    language: Language = Language.TH,
) -> str:
    tmpl = TREND_ANALYSIS_PROMPT_TH if language == Language.TH else TREND_ANALYSIS_PROMPT_EN
    return tmpl.format(name=profile.name, days=timeframe_days)


def build_summary_prompt(
    profile: PetProfile,
    period: str,
    language: Language = Language.TH,
) -> str:
    period_map_th = {"weekly": "รอบสัปดาห์ที่ผ่านมา", "monthly": "รอบเดือนที่ผ่านมา"}
    period_str = period_map_th.get(period, period) if language == Language.TH else period
    tmpl = SUMMARY_PROMPT_TH if language == Language.TH else SUMMARY_PROMPT_EN
    return tmpl.format(name=profile.name, period=period_str)
