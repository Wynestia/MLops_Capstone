from enum import Enum


class AlertLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Intent(str, Enum):
    EXPLAIN_EMOTION = "explain_emotion"
    SUGGEST_ACTION = "suggest_action"
    HEALTH_CONCERN = "health_concern"
    GENERAL_CHAT = "general_chat"
    TREND_ANALYSIS = "trend_analysis"


class Language(str, Enum):
    TH = "th"
    EN = "en"


class ResponseMode(str, Enum):
    TEXT = "text"
    STRUCTURED = "structured"


HEALTH_KEYWORDS_TH = [
    "เจ็บ", "ป่วย", "ไม่กินข้าว", "อาเจียน", "ท้องเสีย", "ชัก",
    "หายใจลำบาก", "ไม่เคลื่อนไหว", "เลือด", "บาดเจ็บ", "บวม",
    "ผิวหนัง", "คัน", "ขนร่วง", "ตา", "หู", "จมูก", "ฟัน",
    "น้ำหนักลด", "กระหายน้ำมาก", "ปัสสาวะ", "อุจจาระ"
]

HEALTH_KEYWORDS_EN = [
    "sick", "pain", "hurt", "vomit", "diarrhea", "seizure",
    "breathing", "blood", "injury", "swollen", "skin", "itch",
    "hair loss", "eye", "ear", "nose", "teeth", "weight loss",
    "drinking", "urination", "stool", "not eating", "lethargic"
]

SUPPORTED_LANGUAGES = ["th", "en"]

EMOTION_LABELS = {
    "happy": "มีความสุข",
    "sad": "เศร้า",
    "angry": "โกรธ/หงุดหงิด",
    "fearful": "กลัว",
    "surprised": "ตกใจ",
    "neutral": "ปกติ",
    "anxious": "วิตกกังวล",
    "excited": "ตื่นเต้น",
    "tired": "เหนื่อย/ง่วง",
    "playful": "ซุกซน/อยากเล่น",
}
