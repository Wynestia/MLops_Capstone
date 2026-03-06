"""
services/llm_judge.py
LLM-as-a-Judge: evaluate response quality on relevance, safety, helpfulness.
If score < threshold, flag the response for regeneration or add a warning.
"""
import json
import logging
from dataclasses import dataclass
from typing import Optional
from config.constants import Language

logger = logging.getLogger(__name__)

JUDGE_PROMPT_TH = """ประเมิน AI response ต่อไปนี้ในบริบทของการให้คำปรึกษาสัตว์เลี้ยง
ให้คะแนน 1-5 สำหรับแต่ละเกณฑ์:

คำถามผู้ใช้: {user_message}
Response: {response}

ประเมิน:
1. relevance (1-5): ตอบตรงคำถามหรือไม่?
2. safety (1-5): ไม่วินิจฉัยโรค ไม่สั่งยา ไม่ให้ข้อมูลอันตราย?
3. helpfulness (1-5): มีประโยชน์และ actionable หรือไม่?

ตอบในรูปแบบ JSON เท่านั้น:
{{"relevance": 0, "safety": 0, "helpfulness": 0, "reason": "..."}}"""

JUDGE_PROMPT_EN = """Evaluate the following AI response in the context of pet consultation.
Score 1-5 for each criterion:

User question: {user_message}
Response: {response}

Evaluate:
1. relevance (1-5): Does it answer the question?
2. safety (1-5): No disease diagnosis, no medication, no dangerous advice?
3. helpfulness (1-5): Is it useful and actionable?

Respond in JSON only:
{{"relevance": 0, "safety": 0, "helpfulness": 0, "reason": "..."}}"""


@dataclass
class JudgeResult:
    relevance: float
    safety: float
    helpfulness: float
    reason: str
    passed: bool

    @property
    def avg_score(self) -> float:
        return (self.relevance + self.safety + self.helpfulness) / 3


SAFETY_THRESHOLD = 3.0   # safety must be at least this
OVERALL_THRESHOLD = 3.0  # average must be at least this

WARNING_TH = "\n\n⚠️ *หมายเหตุ:* คำตอบนี้ผ่านการตรวจสอบคุณภาพบางส่วน กรุณาใช้วิจารณญาณและปรึกษาสัตวแพทย์หากมีข้อสงสัย"
WARNING_EN = "\n\n⚠️ *Note:* This response has partially passed quality checks. Please use judgment and consult a vet if in doubt."


async def judge_response(
    groq_client,
    user_message: str,
    response: str,
    language: Language = Language.TH,
) -> JudgeResult:
    """
    Use LLM to score the response on relevance, safety, helpfulness.
    Returns JudgeResult with pass/fail and scores.
    """
    tmpl = JUDGE_PROMPT_TH if language == Language.TH else JUDGE_PROMPT_EN
    prompt = tmpl.format(user_message=user_message, response=response[:800])

    raw = await groq_client.chat(
        system_prompt="You are a strict AI quality evaluator. Respond only with JSON.",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=200,
    )

    try:
        clean = (raw or "{}").strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(clean)
        result = JudgeResult(
            relevance=float(data.get("relevance", 3)),
            safety=float(data.get("safety", 3)),
            helpfulness=float(data.get("helpfulness", 3)),
            reason=data.get("reason", ""),
            passed=True,
        )
        # Fail if safety is too low or overall is too low
        result.passed = (
            result.safety >= SAFETY_THRESHOLD
            and result.avg_score >= OVERALL_THRESHOLD
        )
        logger.info(
            f"[LLM-Judge] relevance={result.relevance} safety={result.safety} "
            f"helpfulness={result.helpfulness} passed={result.passed}"
        )
        return result
    except Exception as e:
        logger.warning(f"[LLM-Judge] Failed to parse judge response: {e}")
        return JudgeResult(relevance=3, safety=3, helpfulness=3, reason="parse error", passed=True)


def apply_judge_warning(
    response: str,
    result: JudgeResult,
    language: Language = Language.TH,
) -> str:
    """Append a warning to a response that failed the judge."""
    if not result.passed:
        warning = WARNING_TH if language == Language.TH else WARNING_EN
        return response + warning
    return response
