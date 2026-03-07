from typing import List, Dict, Tuple
from collections import Counter
from datetime import datetime, timedelta
from schemas.request import EmotionRecord
from config.constants import AlertLevel


def compute_emotion_distribution(history: List[EmotionRecord]) -> Dict[str, float]:
    """คำนวณสัดส่วนของแต่ละ emotion"""
    if not history:
        return {}
    counter = Counter(r.emotion_label for r in history)
    total = len(history)
    return {emotion: count / total for emotion, count in counter.most_common()}


def find_dominant_emotion(history: List[EmotionRecord]) -> str:
    """หา emotion ที่พบบ่อยที่สุด"""
    if not history:
        return "unknown"
    dist = compute_emotion_distribution(history)
    return max(dist, key=dist.get) if dist else "unknown"


def detect_trend(history: List[EmotionRecord]) -> str:
    """
    วิเคราะห์แนวโน้ม:
    - improving: อารมณ์ดีขึ้น (positive emotions เพิ่มขึ้น)
    - declining: อารมณ์แย่ลง
    - stable: ค่อนข้างคงที่
    - fluctuating: แปรปรวนมาก
    """
    if len(history) < 3:
        return "stable"

    POSITIVE = {"happy", "excited", "playful", "neutral"}
    NEGATIVE = {"sad", "angry", "fearful", "anxious", "tired"}

    sorted_h = sorted(history, key=lambda x: x.timestamp)
    half = len(sorted_h) // 2
    first_half = sorted_h[:half]
    second_half = sorted_h[half:]

    def positive_ratio(records):
        pos = sum(1 for r in records if r.emotion_label in POSITIVE)
        return pos / len(records) if records else 0

    first_ratio = positive_ratio(first_half)
    second_ratio = positive_ratio(second_half)
    diff = second_ratio - first_ratio

    # Check fluctuation: count emotion changes
    changes = sum(
        1 for i in range(1, len(sorted_h))
        if sorted_h[i].emotion_label != sorted_h[i - 1].emotion_label
    )
    change_rate = changes / len(sorted_h)

    if change_rate > 0.7:
        return "fluctuating"
    if diff > 0.2:
        return "improving"
    if diff < -0.2:
        return "declining"
    return "stable"


def detect_anomalies(history: List[EmotionRecord]) -> List[str]:
    """ตรวจจับ pattern ผิดปกติ"""
    anomalies = []
    if not history:
        return anomalies

    sorted_h = sorted(history, key=lambda x: x.timestamp, reverse=True)

    # Check consecutive negative emotions
    NEGATIVE = {"sad", "angry", "fearful", "anxious"}
    consecutive_neg = 0
    for r in sorted_h[:7]:
        if r.emotion_label in NEGATIVE:
            consecutive_neg += 1
        else:
            break
    if consecutive_neg >= 3:
        anomalies.append(f"พบอารมณ์เชิงลบต่อเนื่อง {consecutive_neg} ครั้ง" )

    # Check low confidence streak
    low_conf = sum(1 for r in sorted_h[:5] if r.confidence < 0.5)
    if low_conf >= 3:
        anomalies.append("ความแม่นยำในการวิเคราะห์ต่ำหลายครั้งติดต่อกัน")

    # Check rapid mood swings
    if len(sorted_h) >= 4:
        labels = [r.emotion_label for r in sorted_h[:6]]
        unique = len(set(labels))
        if unique >= 4:
            anomalies.append("ตรวจพบการเปลี่ยนแปลงอารมณ์บ่อยผิดปกติ")

    return anomalies


def get_alert_from_analysis(trend: str, anomalies: List[str], dominant: str) -> AlertLevel:
    NEGATIVE_DOMINANTS = {"sad", "angry", "fearful", "anxious"}
    if trend == "declining" and dominant in NEGATIVE_DOMINANTS:
        return AlertLevel.MEDIUM
    if len(anomalies) >= 2:
        return AlertLevel.MEDIUM
    if len(anomalies) == 1:
        return AlertLevel.LOW
    return AlertLevel.NONE
