from config.constants import Intent, HEALTH_KEYWORDS_TH, HEALTH_KEYWORDS_EN


EXPLAIN_KEYWORDS_TH = ["ทำไม", "เพราะ", "หมายความ", "อธิบาย", "รู้สึก", "รู้สึกอะไร", "หมายถึง"]
EXPLAIN_KEYWORDS_EN = ["why", "because", "explain", "mean", "feeling", "what does", "understand"]

SUGGEST_KEYWORDS_TH = ["ควรทำ", "ช่วย", "แนะนำ", "ต้องการ", "วิธี", "ทำยังไง", "ปรับ", "แก้ไข"]
SUGGEST_KEYWORDS_EN = ["should", "help", "suggest", "recommend", "how to", "what can", "improve", "fix"]

TREND_KEYWORDS_TH = ["แนวโน้ม", "ช่วง", "สัปดาห์", "เดือน", "บ่อย", "เปลี่ยนแปลง", "ประวัติ"]
TREND_KEYWORDS_EN = ["trend", "week", "month", "history", "pattern", "often", "change", "over time"]


def detect_intent(message: str) -> Intent:
    """วิเคราะห์ intent จาก user message"""
    msg_lower = message.lower()

    # Health concern (highest priority)
    all_health = HEALTH_KEYWORDS_TH + HEALTH_KEYWORDS_EN
    if any(kw in msg_lower for kw in all_health):
        return Intent.HEALTH_CONCERN

    # Trend analysis
    all_trend = TREND_KEYWORDS_TH + TREND_KEYWORDS_EN
    if any(kw in msg_lower for kw in all_trend):
        return Intent.TREND_ANALYSIS

    # Suggest action
    all_suggest = SUGGEST_KEYWORDS_TH + SUGGEST_KEYWORDS_EN
    if any(kw in msg_lower for kw in all_suggest):
        return Intent.SUGGEST_ACTION

    # Explain emotion
    all_explain = EXPLAIN_KEYWORDS_TH + EXPLAIN_KEYWORDS_EN
    if any(kw in msg_lower for kw in all_explain):
        return Intent.EXPLAIN_EMOTION

    return Intent.GENERAL_CHAT
