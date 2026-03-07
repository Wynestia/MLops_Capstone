"""
services/reflexion.py
Reflexion: draft → self-critique → improved final response
ใช้กับ health_concern เพื่อเพิ่ม accuracy และลด hallucination
"""
import logging
from typing import Optional
from config.constants import Language

logger = logging.getLogger(__name__)

CRITIQUE_PROMPT_TH = """อ่าน draft response ด้านล่าง แล้วตรวจสอบตามเกณฑ์นี้:
1. มีการวินิจฉัยโรคหรือสั่งยาหรือไม่? (ห้ามโดยเด็ดขาด)
2. คำแนะนำมีความปลอดภัยและเหมาะสมหรือไม่?
3. มีข้อมูลที่คลุมเครือหรือน่าสงสัยหรือไม่?
4. มีอะไรที่ขาดหายไปที่ควรบอกเจ้าของ?

Draft:
{draft}

ตอบสั้น ๆ ว่า: จุดที่ต้องแก้ไขคืออะไร? (ถ้าไม่มีให้บอกว่า "ผ่านแล้ว")"""

CRITIQUE_PROMPT_EN = """Read the draft response below and evaluate it against these criteria:
1. Does it diagnose diseases or prescribe medication? (strictly forbidden)
2. Are the recommendations safe and appropriate?
3. Is there any vague or suspicious information?
4. Is there anything missing that the owner should know?

Draft:
{draft}

Briefly state: What needs to be corrected? (If nothing, say "Looks good")"""

REFINE_PROMPT_TH = """ต่อไปนี้คือ draft response และ critique จาก AI

Draft:
{draft}

Critique:
{critique}

เขียน final response ที่แก้ไขจุดบกพร่องที่ระบุไว้ใน critique แล้ว
ถ้า critique บอกว่าผ่านแล้ว ให้คืน draft โดยไม่ต้องแก้ไข"""

REFINE_PROMPT_EN = """Below is a draft response and a self-critique from the AI.

Draft:
{draft}

Critique:
{critique}

Write the final improved response addressing the issues raised in the critique.
If the critique says "Looks good", return the draft unchanged."""


async def run_reflexion(
    groq_client,
    system_prompt: str,
    messages: list,
    language: Language = Language.TH,
    temperature: float = 0.3,
) -> Optional[str]:
    """
    3-step Reflexion loop:
    1. Generate draft response
    2. Self-critique the draft
    3. Generate improved final response
    """
    # Step 1: Draft
    draft = await groq_client.chat(
        system_prompt=system_prompt,
        messages=messages,
        temperature=temperature,
    )
    if not draft:
        return None

    logger.info("[Reflexion] Draft generated, starting self-critique")

    # Step 2: Self-critique
    critique_tmpl = CRITIQUE_PROMPT_TH if language == Language.TH else CRITIQUE_PROMPT_EN
    critique_prompt = critique_tmpl.format(draft=draft)
    critique = await groq_client.chat(
        system_prompt="You are a quality reviewer for AI pet health advice.",
        messages=[{"role": "user", "content": critique_prompt}],
        temperature=0.2,
    )
    if not critique:
        return draft   # fallback to draft if critique fails

    logger.info(f"[Reflexion] Critique: {critique[:80]}...")

    # Skip refinement if critique says it's fine
    fine_keywords = ["ผ่านแล้ว", "looks good", "no issues", "ไม่มีปัญหา", "correct"]
    if any(kw in critique.lower() for kw in fine_keywords):
        logger.info("[Reflexion] Critique passed — returning draft")
        return draft

    # Step 3: Refine
    refine_tmpl = REFINE_PROMPT_TH if language == Language.TH else REFINE_PROMPT_EN
    refine_prompt = refine_tmpl.format(draft=draft, critique=critique)
    final = await groq_client.chat(
        system_prompt=system_prompt,
        messages=messages + [{"role": "user", "content": refine_prompt}],
        temperature=temperature,
    )
    logger.info("[Reflexion] Final response generated after refinement")
    return final or draft
