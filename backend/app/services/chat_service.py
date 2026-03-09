"""
AI Chat Service
Builds context-aware prompts from dog history and calls Groq LLM.
Model: llama-3.3-70b-versatile
"""
import logging
import re

from app.core.config import settings

logger = logging.getLogger(__name__)


SYSTEM_PROMPT_TEMPLATE = """You are a compassionate and knowledgeable dog wellness advisor for PawMind app.
You are advising the owner of {dog_name}, a {age}-year-old {breed}.

Language policy:
- Respond in Thai by default.
- If the user explicitly asks for English, respond in English.

Critical name-preservation policy:
- Keep all canonical terms exactly as provided.
- Never translate, transliterate, or rewrite proper nouns.
- This includes: dog name, breed name, medication names, vaccine names, person/clinic names, product brands, and microchip IDs.
- If you respond in Thai, keep those canonical terms in their original script/spelling.

Canonical terms (must remain unchanged):
{canonical_terms}

Current dog profile:
{profile_block}

Latest analysis:
{latest_analysis}

Recent mood history:
{mood_history}

Recent analysis history:
{analysis_history}

Weight history:
{weight_history}

Recent activity history:
{activity_history}

Medications:
{medications}

Health records:
{health_records}

Vaccines:
{vaccines}

Recent journal notes:
{journal_notes}

Response mode:
- Current mode: {response_mode}
- Mode rule:
{mode_instructions}

Guidelines:
- Always prioritize provided context and conversation history.
- Do not invent dog-specific facts that are not in the provided context.
- If specific dog data is missing, say clearly that it is unavailable.
- Refer to the dog only by the exact canonical name token: `{dog_name}`.
- Never create translated or transliterated versions of `{dog_name}` (for example Thai phonetic spelling).
- Mention the exact `{dog_name}` at least once in each answer.
- When reporting sex, use only `male`, `female`, or `unknown` (Thai wording is allowed, but no other language scripts).
- Provide practical, actionable advice.
- Recommend vet consultation for serious concerns.
- Keep responses warm, helpful, and concise.
- Do not use fixed section headers like "Summary", "Based on {dog_name}'s Data", "Recommendations", or "Watch-outs".
- You may use short bullets when helpful, but keep the response natural and direct.
"""


def _lines_or_default(lines: list[str], fallback: str) -> str:
    if not lines:
        return fallback
    return "\n".join(lines)


class ChatService:
    def __init__(self):
        self.client = None
        self._try_init_client()

    def _try_init_client(self):
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith("gsk_your"):
            logger.warning("Groq API key not set. Chat will use mock responses.")
            return
        try:
            from groq import AsyncGroq

            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            logger.info("Groq client initialized (model: %s)", settings.GROQ_MODEL)
        except Exception as e:
            logger.error("Failed to init Groq: %s", e)

    def _mode_instruction_text(self, response_mode: str) -> str:
        mode = (response_mode or "balanced").lower()
        if mode == "grounded":
            return (
                "- Grounded mode: answer strictly from the provided context and history.\n"
                "- If context is missing, explicitly say data is unavailable.\n"
                "- Keep recommendations conservative and tied to available records."
            )
        if mode == "general":
            return (
                "- General mode: you may provide broad canine-care guidance even when data is missing.\n"
                "- Still avoid fabricating dog-specific facts.\n"
                "- Clearly separate generic advice from record-based facts."
            )
        return (
            "- Balanced mode: start from provided dog records first.\n"
            "- If records are insufficient, add general best-practice guidance.\n"
            "- Explicitly label which points are record-based vs general."
        )

    def _has_rich_context(self, dog_context: dict) -> bool:
        evidence_count = 0
        for key in [
            "mood_history",
            "analysis_history",
            "weight_history",
            "activity_history",
            "medications",
            "health_records",
            "vaccines",
            "journal_entries",
        ]:
            evidence_count += len(dog_context.get(key, []) or [])
        return evidence_count >= 3

    def _resolve_response_mode(
        self,
        requested_mode: str,
        user_message: str,
        dog_context: dict,
    ) -> str:
        mode = (requested_mode or "auto").strip().lower()
        if mode in {"grounded", "balanced", "general"}:
            return mode

        msg = " ".join((user_message or "").lower().split())

        strict_keywords = [
            "from record",
            "from records",
            "from system",
            "history only",
            "database only",
            "exact data",
            "exact record",
            "stored data",
            "saved records",
            "according to records",
            "\u0e15\u0e32\u0e21\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
            "\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1a",
            "\u0e08\u0e32\u0e01\u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01",
            "\u0e15\u0e32\u0e21\u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01",
            "\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34\u0e43\u0e19\u0e23\u0e30\u0e1a\u0e1a",
            "\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e43\u0e19\u0e23\u0e30\u0e1a\u0e1a",
            "\u0e10\u0e32\u0e19\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
            "\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
        ]
        strict_question_terms = [
            "latest",
            "last",
            "history",
            "record",
            "records",
            "log",
            "logs",
            "analysis",
            "analyses",
            "mood",
            "weight",
            "activity",
            "medication",
            "medicine",
            "vaccine",
            "\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14",
            "\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34",
            "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01",
            "\u0e2d\u0e32\u0e23\u0e21\u0e13\u0e4c",
            "\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01",
            "\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21",
            "\u0e22\u0e32",
            "\u0e27\u0e31\u0e04\u0e0b\u0e35\u0e19",
        ]
        question_words = [
            "what",
            "which",
            "when",
            "show",
            "list",
            "how many",
            "\u0e2d\u0e30\u0e44\u0e23",
            "\u0e44\u0e2b\u0e19",
            "\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e44\u0e2b\u0e23\u0e48",
            "\u0e41\u0e2a\u0e14\u0e07",
            "\u0e21\u0e35\u0e2d\u0e30\u0e44\u0e23\u0e1a\u0e49\u0e32\u0e07",
            "\u0e01\u0e35\u0e48",
        ]
        general_keywords = [
            "general advice",
            "in general",
            "overall tips",
            "not from records",
            "broad advice",
            "best practice",
            "\u0e17\u0e31\u0e48\u0e27\u0e44\u0e1b",
            "\u0e42\u0e14\u0e22\u0e23\u0e27\u0e21",
            "\u0e44\u0e21\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e2d\u0e34\u0e07\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
            "\u0e44\u0e21\u0e48\u0e2d\u0e34\u0e07\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
            "\u0e04\u0e33\u0e41\u0e19\u0e30\u0e19\u0e33\u0e17\u0e31\u0e48\u0e27\u0e44\u0e1b",
            "\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21",
        ]
        emergency_keywords = [
            "emergency",
            "urgent",
            "seizure",
            "can't breathe",
            "bleeding",
            "poison",
            "collapse",
            "\u0e09\u0e38\u0e01\u0e40\u0e09\u0e34\u0e19",
            "\u0e14\u0e48\u0e27\u0e19",
            "\u0e0a\u0e31\u0e01",
            "\u0e2b\u0e32\u0e22\u0e43\u0e08\u0e44\u0e21\u0e48\u0e2d\u0e2d\u0e01",
            "\u0e40\u0e25\u0e37\u0e2d\u0e14\u0e2d\u0e2d\u0e01",
            "\u0e01\u0e34\u0e19\u0e1e\u0e34\u0e29",
            "\u0e2b\u0e21\u0e14\u0e2a\u0e15\u0e34",
        ]

        if any(keyword in msg for keyword in strict_keywords):
            return "grounded"

        asks_record_question = (
            any(term in msg for term in strict_question_terms)
            and any(term in msg for term in question_words)
        )
        if asks_record_question:
            return "grounded"

        if any(keyword in msg for keyword in general_keywords):
            return "general"

        # For urgent symptom questions, widen scope by default.
        if any(keyword in msg for keyword in emergency_keywords):
            return "general"

        if not self._has_rich_context(dog_context):
            return "general"

        return "balanced"

    def _ensure_markdown_response(self, text: str, dog_name: str) -> str:
        content = str(text or "").strip()
        if not content:
            return (
                f"ยังไม่สามารถสร้างคำตอบสำหรับ {dog_name} ได้ในขณะนี้ "
                "กรุณาลองถามใหม่อีกครั้ง และหากมีอาการรุนแรงให้พาไปพบสัตวแพทย์ทันที"
            )

        # Remove legacy fixed section headers if the model still emits them.
        banned_header_patterns = (
            r"^\s{0,3}#{1,3}\s*summary\s*$",
            r"^\s{0,3}#{1,3}\s*based on\b.*$",
            r"^\s{0,3}#{1,3}\s*recommendations\s*$",
            r"^\s{0,3}#{1,3}\s*watch-?outs\s*$",
            r"^\s*summary\s*$",
            r"^\s*based on\b.*$",
            r"^\s*recommendations\s*$",
            r"^\s*watch-?outs\s*$",
        )
        cleaned_lines = []
        for raw_line in content.splitlines():
            line = raw_line.strip()
            if any(re.match(pattern, line, flags=re.IGNORECASE) for pattern in banned_header_patterns):
                continue
            cleaned_lines.append(raw_line)

        cleaned = "\n".join(cleaned_lines).strip()
        return cleaned or content

    def _fallback_title(self, first_message: str) -> str:
        msg = re.sub(r"\s+", " ", str(first_message or "").strip())
        if not msg:
            return "New chat"

        lowered = msg.lower().strip(" .,:;!?\"'`()[]{}")
        generic_inputs = {
            "hi",
            "hello",
            "hey",
            "good morning",
            "good afternoon",
            "good evening",
            "yo",
            "ok",
            "okay",
            "thanks",
            "thank you",
            "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35",
            "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e23\u0e31\u0e1a",
            "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e48\u0e30",
            "\u0e2b\u0e27\u0e31\u0e14\u0e14\u0e35",
        }
        if lowered in generic_inputs:
            return "New chat"
        generic_words = {
            "hi",
            "hello",
            "hey",
            "yo",
            "ok",
            "okay",
            "thanks",
            "thank",
            "you",
        }
        words = re.findall(r"[a-z0-9]+", lowered)
        if words and len(words) <= 3 and all(w in generic_words for w in words):
            return "New chat"

        title = msg.strip(" .,:;!?\"'`()[]{}")
        if len(title) > 48:
            title = title[:48].rstrip() + "..."
        return title or "New chat"

    def _sanitize_title(self, raw_title: str, fallback: str) -> str:
        text = str(raw_title or "").strip()
        if not text:
            return fallback
        text = re.sub(r"^#+\s*", "", text)
        text = text.replace("\n", " ").replace("\r", " ")
        text = re.sub(r"\s+", " ", text).strip()
        text = text.strip(" .,:;!?\"'`()[]{}")
        if text.lower() in {"new chat", "chat", "conversation", "untitled", "general chat"}:
            return fallback
        if len(text) > 64:
            text = text[:64].rstrip(" .,:;!?\"'`()[]{}")
        return text or fallback

    async def suggest_conversation_title(
        self,
        first_message: str,
        dog_name: str,
        assistant_reply: str | None = None,
    ) -> str:
        fallback = self._fallback_title(first_message)
        if not self.client:
            return fallback

        system_prompt = (
            "Create a short chat title (max 7 words) that summarizes the main discussion topic.\n"
            "Rules:\n"
            "- Return only the title text, no quotes, no markdown.\n"
            "- Be concise and specific.\n"
            "- Avoid generic titles like Hi/Hello/New chat.\n"
            f"- Keep the dog's name unchanged when used: {dog_name}.\n"
        )
        user_prompt = (
            f"User message: {first_message}\n"
            f"Assistant reply (optional context): {assistant_reply or ''}"
        )

        try:
            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=24,
                temperature=0.2,
            )
            raw = response.choices[0].message.content if response.choices else ""
            return self._sanitize_title(raw, fallback)
        except Exception as e:
            logger.warning("Title generation failed, using fallback: %s", e)
            return fallback

    def build_system_prompt(self, dog_context: dict, response_mode: str = "balanced") -> str:
        profile_lines = [
            f"- Name: {dog_context.get('name', 'unknown')}",
            f"- Breed: {dog_context.get('breed', 'unknown')}",
            f"- Age: {dog_context.get('age', 'unknown')}",
            f"- Birthday: {dog_context.get('birthday', 'unknown')}",
            f"- Sex: {dog_context.get('sex', 'unknown')}",
            f"- Latest weight: {dog_context.get('latest_weight_kg', 'unknown')} kg",
            f"- Energy level: {dog_context.get('energy_level', 'unknown')}",
            f"- Current status: {dog_context.get('current_status', 'unknown')}",
            f"- Microchip: {dog_context.get('microchip', 'unknown')}",
            f"- Notes: {dog_context.get('notes', 'none')}",
        ]
        profile_block = "\n".join(profile_lines)

        latest_analysis_ctx = dog_context.get("latest_analysis")
        if latest_analysis_ctx:
            latest_analysis = "\n".join(
                [
                    f"- Time: {latest_analysis_ctx.get('analyzed_at', 'unknown')}",
                    f"- Mood: {latest_analysis_ctx.get('mood', 'unknown')}",
                    f"- Confidence: {latest_analysis_ctx.get('confidence', 'unknown')}%",
                    f"- Model: {latest_analysis_ctx.get('model_version', 'unknown')}",
                ]
            )
        else:
            latest_analysis = "No analysis yet."

        canonical_terms = _lines_or_default(
            [f"- {v}" for v in dog_context.get("canonical_terms", []) if str(v).strip()],
            "- (none)",
        )

        mood_history = _lines_or_default(
            [
                f"- {m.get('logged_at', 'unknown')}: {m.get('mood', 'unknown')} [{m.get('source', 'unknown')}] {m.get('note', '')}".strip()
                for m in dog_context.get("mood_history", [])
            ],
            "No recent mood records.",
        )

        analysis_history = _lines_or_default(
            [
                f"- {a.get('analyzed_at', 'unknown')}: {a.get('mood', 'unknown')} ({a.get('confidence', 'unknown')}%)"
                for a in dog_context.get("analysis_history", [])
            ],
            "No recent analysis records.",
        )

        weight_history = _lines_or_default(
            [f"- {w.get('recorded_at', 'unknown')}: {w.get('weight_kg', 'unknown')} kg" for w in dog_context.get("weight_history", [])],
            "No weight records.",
        )

        activity_history = _lines_or_default(
            [
                f"- {a.get('logged_date', 'unknown')}: walk {a.get('walk_min', 0)}m, play {a.get('play_min', 0)}m, train {a.get('train_min', 0)}m; note={a.get('notes', '-')}"
                for a in dog_context.get("activity_history", [])
            ],
            "No activity records.",
        )

        medications = _lines_or_default(
            [
                f"- {m.get('name', 'unknown')} | type={m.get('type', '-')} | dose={m.get('dose', '-')} | freq={m.get('frequency', '-')} | status={m.get('status', '-')}"
                for m in dog_context.get("medications", [])
            ],
            "None.",
        )

        health_records = _lines_or_default(
            [
                f"- {r.get('condition', 'unknown')} | severity={r.get('severity', '-')} | status={r.get('status', '-')} | diagnosed={r.get('diagnosed_date', '-')}"
                for r in dog_context.get("health_records", [])
            ],
            "None.",
        )

        vaccines = _lines_or_default(
            [
                f"- {v.get('name', 'unknown')} | status={v.get('status', '-')} | last={v.get('last_date', '-')} | next_due={v.get('next_due', '-')}"
                for v in dog_context.get("vaccines", [])
            ],
            "None.",
        )

        journal_notes = _lines_or_default(
            [
                f"- {j.get('entry_date', 'unknown')} ({j.get('mood', '-')}) : {j.get('content', '')}"
                for j in dog_context.get("journal_entries", [])
            ],
            "No recent journal entries.",
        )

        return SYSTEM_PROMPT_TEMPLATE.format(
            dog_name=dog_context.get("name", "your dog"),
            age=dog_context.get("age", "unknown"),
            breed=dog_context.get("breed", "mixed breed"),
            canonical_terms=canonical_terms,
            profile_block=profile_block,
            latest_analysis=latest_analysis,
            mood_history=mood_history,
            analysis_history=analysis_history,
            weight_history=weight_history,
            activity_history=activity_history,
            medications=medications,
            health_records=health_records,
            vaccines=vaccines,
            journal_notes=journal_notes,
            response_mode=(response_mode or "balanced").lower(),
            mode_instructions=self._mode_instruction_text(response_mode),
        )

    async def chat(
        self,
        user_message: str,
        conversation_history: list[dict],
        dog_context: dict,
        response_mode: str = "auto",
    ) -> str:
        if not self.client:
            return self._mock_response(dog_context)

        mode = self._resolve_response_mode(response_mode, user_message, dog_context)
        system_prompt = self.build_system_prompt(dog_context, response_mode=mode)
        messages = [{"role": "system", "content": system_prompt}]

        for msg in conversation_history[-10:]:
            role = msg.get("role")
            content = msg.get("content")
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})

        # Avoid duplicate final user message if caller already included it in history.
        if not (
            messages
            and messages[-1]["role"] == "user"
            and str(messages[-1]["content"]).strip() == str(user_message).strip()
        ):
            messages.append({"role": "user", "content": user_message})

        try:
            temperature_by_mode = {
                "grounded": 0.25,
                "balanced": 0.45,
                "general": 0.7,
            }
            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                max_tokens=700,
                temperature=temperature_by_mode.get(mode, 0.45),
            )
            return self._ensure_markdown_response(
                response.choices[0].message.content,
                dog_context.get("name", "your dog"),
            )
        except Exception as e:
            logger.error("Groq API error: %s", e)
            return self._mock_response(dog_context)

    def _mock_response(self, dog_context: dict) -> str:
        name = dog_context.get("name", "your dog")
        breed = dog_context.get("breed", "mixed breed")
        return (
            f"ตอนนี้ระบบโหลดข้อมูลของ {name} ({breed}) ได้แล้ว "
            "แต่บริการ AI ภายนอกไม่พร้อมใช้งานชั่วคราว จึงตอบได้แบบจำกัดในขณะนี้ "
            "ลองส่งคำถามใหม่อีกครั้งในอีกสักครู่"
        )


chat_service = ChatService()

