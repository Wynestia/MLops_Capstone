"""
AI Chat Service
Builds context-aware prompts from dog history and calls Groq LLM.
Model: llama-3.3-70b-versatile
"""
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


SYSTEM_PROMPT_TEMPLATE = """You are a compassionate and knowledgeable dog wellness advisor for PawMind app.
You are advising the owner of {dog_name}, a {age}-year-old {breed}.

Current dog profile:
- Weight: {weight_kg} kg
- Sex: {sex}
- Energy level: {energy_level}

Recent mood history (last 7 days):
{mood_history}

Active medications:
{medications}

Ongoing health records:
{health_records}

Recent journal notes:
{journal_notes}

Guidelines:
- Always refer to the dog by name
- Provide practical, actionable advice
- Recommend vet consultation for serious concerns
- Keep responses warm, helpful, and concise
- Respond in Thai by default
- If the user explicitly asks for English, respond in English
- Add relevant emojis to make responses friendly
"""


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

    def build_system_prompt(self, dog_context: dict) -> str:
        mood_history = "\n".join(
            [f"  - {m['logged_at']}: {m['mood']} ({m.get('note', '')})" for m in dog_context.get("mood_history", [])]
        ) or "  No recent mood records"

        medications = "\n".join(
            [f"  - {m['name']} {m['dose']} ({m['frequency']})" for m in dog_context.get("medications", [])]
        ) or "  None"

        health_records = "\n".join(
            [f"  - {r['condition']} [{r['severity']}] - {r['status']}" for r in dog_context.get("health_records", [])]
        ) or "  None"

        journal_notes = "\n".join(
            [f"  - {j['entry_date']}: {j['content']}" for j in dog_context.get("journal_entries", [])]
        ) or "  No recent journal entries"

        return SYSTEM_PROMPT_TEMPLATE.format(
            dog_name=dog_context.get("name", "your dog"),
            age=dog_context.get("age", "unknown"),
            breed=dog_context.get("breed", "mixed breed"),
            weight_kg=dog_context.get("weight_kg", "unknown"),
            sex=dog_context.get("sex", "unknown"),
            energy_level=dog_context.get("energy_level", "medium"),
            mood_history=mood_history,
            medications=medications,
            health_records=health_records,
            journal_notes=journal_notes,
        )

    async def chat(
        self,
        user_message: str,
        conversation_history: list[dict],
        dog_context: dict,
    ) -> str:
        if not self.client:
            return self._mock_response(dog_context)

        system_prompt = self.build_system_prompt(dog_context)
        messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        try:
            response = await self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                max_tokens=600,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("Groq API error: %s", e)
            return self._mock_response(dog_context)

    def _mock_response(self, dog_context: dict) -> str:
        name = dog_context.get("name", "น้องหมาของคุณ")
        breed = dog_context.get("breed", "สายพันธุ์ของน้อง")
        return (
            f"จากข้อมูลล่าสุดของ {name} พฤติกรรมที่เห็นถือว่าพบได้ในน้องสายพันธุ์ {breed} ค่อนข้างบ่อยครับ "
            "แนะนำให้คงกิจวัตรประจำวันให้สม่ำเสมอ เพิ่มกิจกรรมออกกำลังกายเบา ๆ และติดตามอาการต่อเนื่องครับ 🐾\n\n"
            "ถ้าอาการนี้ยาวเกิน 2 สัปดาห์ หรือมีอาการผิดปกติอื่นร่วมด้วย ควรพาไปพบสัตวแพทย์เพื่อประเมินเพิ่มเติมครับ\n\n"
            "*(หมายเหตุ: ตอนนี้ระบบแชตยังอยู่ในโหมดเดโม หากต้องการคำตอบจากโมเดลจริงให้ตั้งค่า `GROQ_API_KEY` ใน `.env`)*"
        )


chat_service = ChatService()
