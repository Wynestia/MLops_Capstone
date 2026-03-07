from config.constants import Language


def detect_language(text: str) -> Language:
    """
    ตรวจจับภาษาจาก text อย่างง่าย
    - ถ้ามี Unicode ช่วงภาษาไทย (U+0E00–U+0E7F) → Thai
    - อื่นๆ → English
    """
    thai_chars = sum(1 for c in text if '\u0e00' <= c <= '\u0e7f')
    ratio = thai_chars / len(text) if text else 0
    return Language.TH if ratio > 0.1 else Language.EN
