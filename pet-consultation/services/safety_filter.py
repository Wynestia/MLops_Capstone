from config.constants import (
    Intent, AlertLevel, HEALTH_KEYWORDS_TH, HEALTH_KEYWORDS_EN
)


def check_medical_keywords(text: str) -> bool:
    """ตรวจสอบว่ามี keyword สุขภาพหรือไม่"""
    text_lower = text.lower()
    all_keywords = HEALTH_KEYWORDS_TH + HEALTH_KEYWORDS_EN
    return any(kw in text_lower for kw in all_keywords)


def determine_alert_level(intent: Intent, confidence: float, emotion_label: str) -> AlertLevel:
    """กำหนด alert level จาก intent และ emotion"""
    if intent == Intent.HEALTH_CONCERN:
        return AlertLevel.HIGH

    high_alert_emotions = {"anxious", "fearful"}
    medium_alert_emotions = {"sad", "angry"}

    if emotion_label in high_alert_emotions and confidence > 0.7:
        return AlertLevel.MEDIUM
    if emotion_label in medium_alert_emotions and confidence > 0.8:
        return AlertLevel.LOW

    return AlertLevel.NONE


def should_add_disclaimer(intent: Intent, user_message: str) -> bool:
    """ตัดสินใจว่าควรแทรก medical disclaimer หรือไม่"""
    if intent == Intent.HEALTH_CONCERN:
        return True
    return check_medical_keywords(user_message)
