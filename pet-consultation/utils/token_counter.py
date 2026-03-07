from typing import List
from config.settings import MAX_CONTEXT_TOKENS
from schemas.request import EmotionRecord


def estimate_tokens(text: str) -> int:
    """ประมาณ token count (rough: ~4 chars per token for English, ~2 for Thai)"""
    return max(len(text) // 3, 1)


def truncate_history_by_token_budget(
    history: List[EmotionRecord],
    system_prompt: str,
    user_message: str,
    budget: int = MAX_CONTEXT_TOKENS,
) -> List[EmotionRecord]:
    """
    ตัด emotion history ที่เก่าที่สุดออกจนกว่า context จะอยู่ใน budget
    """
    base_tokens = estimate_tokens(system_prompt) + estimate_tokens(user_message)
    remaining = budget - base_tokens

    if remaining <= 0:
        return []

    # Sort newest first, keep adding until budget exceeded
    sorted_history = sorted(history, key=lambda x: x.timestamp, reverse=True)
    kept = []
    used = 0

    for record in sorted_history:
        record_text = f"{record.timestamp} {record.emotion_label} {record.confidence}"
        record_tokens = estimate_tokens(record_text)
        if used + record_tokens > remaining:
            break
        kept.append(record)
        used += record_tokens

    return kept
