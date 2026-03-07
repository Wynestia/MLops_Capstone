"""
services/history_summarizer.py
Rule-based emotion history summarizer — แทนการตัดประวัติทิ้ง
"""
from typing import List
from collections import Counter
from schemas.request import EmotionRecord
from config.constants import Language


def summarize_emotion_history(
    records: List[EmotionRecord],
    language: Language = Language.TH,
) -> str:
    """
    สร้าง string สรุปประวัติอารมณ์แบบ rule-based
    ใช้แทน hard truncation เมื่อ token เกิน budget
    """
    if not records:
        return ""

    total = len(records)
    counts = Counter(r.emotion_label for r in records)
    dominant = counts.most_common(1)[0][0]
    dominant_pct = counts[dominant] / total

    # Detect overall trend (simple: compare first half vs second half)
    sorted_recs = sorted(records, key=lambda x: x.timestamp)
    mid = len(sorted_recs) // 2
    first_half = sorted_recs[:mid] if mid > 0 else sorted_recs
    second_half = sorted_recs[mid:] if mid > 0 else sorted_recs

    POSITIVE_EMOTIONS = {"happy", "excited", "playful", "neutral"}
    NEGATIVE_EMOTIONS = {"sad", "angry", "anxious", "fearful", "tired"}

    def positivity_score(recs: List[EmotionRecord]) -> float:
        if not recs:
            return 0.5
        pos = sum(1 for r in recs if r.emotion_label in POSITIVE_EMOTIONS)
        return pos / len(recs)

    first_score = positivity_score(first_half)
    second_score = positivity_score(second_half)
    diff = second_score - first_score

    if diff > 0.2:
        trend = "ดีขึ้น" if language == Language.TH else "improving"
    elif diff < -0.2:
        trend = "แย่ลง" if language == Language.TH else "declining"
    else:
        trend = "คงที่" if language == Language.TH else "stable"

    # Top 3 emotions
    top3 = counts.most_common(3)
    top3_str = ", ".join(
        f"{label} ({cnt}/{total})" for label, cnt in top3
    )

    if language == Language.TH:
        return (
            f"[สรุปประวัติ {total} ครั้ง] "
            f"อารมณ์หลัก: {dominant} ({dominant_pct:.0%}) | "
            f"แนวโน้ม: {trend} | "
            f"การกระจาย: {top3_str}"
        )
    else:
        return (
            f"[History summary: {total} records] "
            f"Dominant: {dominant} ({dominant_pct:.0%}) | "
            f"Trend: {trend} | "
            f"Distribution: {top3_str}"
        )
