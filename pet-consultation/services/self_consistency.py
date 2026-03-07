"""
services/self_consistency.py
Self-Consistency: sample N responses, return the most consistent one.
ใช้กับ health_concern — เพิ่ม reliability โดย majority vote บน alert_level
"""
import asyncio
import json
import logging
from typing import Optional
from collections import Counter

logger = logging.getLogger(__name__)

_VOTE_KEYS = ["alert_level", "emotion_label"]


def _extract_vote_fields(text: str) -> dict:
    """พยายาม extract ฟิลด์สำคัญจาก response (JSON หรือ text)"""
    try:
        clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(clean)
        return {k: data.get(k, "") for k in _VOTE_KEYS}
    except Exception:
        # text mode: ดึง alert level จาก keyword
        text_lower = text.lower()
        if "high" in text_lower or "ด่วน" in text_lower or "สัตวแพทย์" in text_lower:
            return {"alert_level": "high"}
        if "medium" in text_lower or "กลาง" in text_lower:
            return {"alert_level": "medium"}
        return {"alert_level": "low"}


def _pick_best(responses: list[str]) -> str:
    """เลือก response ที่ conservative ที่สุดในกรณีมี health concern"""
    PRIORITY = {"high": 0, "medium": 1, "low": 2, "none": 3, "": 4}

    votes = [_extract_vote_fields(r) for r in responses]
    alert_counts = Counter(v.get("alert_level", "") for v in votes)

    # majority vote
    best_alert, best_count = alert_counts.most_common(1)[0]
    if best_count >= 2:
        # return response matching the majority alert
        for r, v in zip(responses, votes):
            if v.get("alert_level", "") == best_alert:
                return r

    # no majority → most conservative
    sorted_responses = sorted(
        zip(responses, votes),
        key=lambda x: PRIORITY.get(x[1].get("alert_level", ""), 4)
    )
    return sorted_responses[0][0]


async def run_self_consistency(
    groq_client,
    system_prompt: str,
    messages: list,
    temperature: float = 0.7,
    n: int = 3,
) -> Optional[str]:
    """
    Sample N completions concurrently and return the most consistent one.
    Uses majority voting on alert_level for health-critical responses.
    """
    tasks = [
        groq_client.chat(
            system_prompt=system_prompt,
            messages=messages,
            temperature=temperature + (i * 0.05),   # slight temp jitter
        )
        for i in range(n)
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    valid = [r for r in results if isinstance(r, str) and r]

    if not valid:
        return None
    if len(valid) == 1:
        return valid[0]

    best = _pick_best(valid)
    logger.info(f"[Self-Consistency] sampled={len(valid)}, selected alert from majority vote")
    return best
