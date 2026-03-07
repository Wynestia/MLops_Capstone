"""
services/hallucination_guard.py
Rule-based hallucination detection for pet consultation responses.
Flags responses that:
  1. Mention specific medications not in whitelist
  2. Make overconfident unsupported claims
  3. Fabricate specific statistics not present in context
"""
import re
import logging
from dataclasses import dataclass, field
from typing import List
from config.constants import Language

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Whitelists & patterns
# ------------------------------------------------------------------

# ยาหรือสารที่ LLM อาจ hallucinate: ถ้าเจอในคำตอบต้อง flag
DANGEROUS_MED_PATTERNS = [
    r"\bibuprofen\b", r"\bacetaminophen\b", r"\bparacetamol\b",
    r"\baspirin\b", r"\bmetronidazole\b", r"\bamoxicillin\b",
    r"\b(ยา|drug|medication|medicine)\s+\w+\b",
    r"\bไอบูโพรเฟน\b", r"\bพาราเซตามอล\b",
]

# Overconfident phrases
OVERCONFIDENT_TH = [
    "แน่นอนว่า", "มั่นใจ 100%", "ฟันธงได้เลยว่า",
    "เป็นโรค", "วินิจฉัยแล้วว่า", "ป่วยเป็น",
]
OVERCONFIDENT_EN = [
    "definitely has", "100% certain", "diagnosed with",
    "is suffering from", "has the disease", "certainly infected",
]

# Fabricated stats pattern: เช่น "73% ของเวลา" ที่ไม่มีอยู่ใน emotion data
FABRICATED_STAT_PATTERN = re.compile(r"\b(\d+(?:\.\d+)?)\s*%", re.IGNORECASE)


@dataclass
class HallucinationResult:
    is_clean: bool
    issues: List[str] = field(default_factory=list)
    risk_level: str = "none"   # none / low / high


HALLUCINATION_WARNING_TH = "\n\n🔍 *ข้อสังเกต:* ระบบตรวจพบข้อมูลที่อาจไม่ถูกต้องในคำตอบนี้ กรุณาตรวจสอบและปรึกษาสัตวแพทย์ก่อนดำเนินการใด ๆ"
HALLUCINATION_WARNING_EN = "\n\n🔍 *Note:* The system detected potentially inaccurate information in this response. Please verify and consult a vet before taking action."


def check_hallucination(
    response: str,
    known_emotions: List[str] | None = None,
    language: Language = Language.TH,
) -> HallucinationResult:
    """
    Check a response for hallucination signals.

    Args:
        response: LLM response text
        known_emotions: list of emotion labels from actual data (to validate any stats)
        language: for localized issue messages
    """
    issues = []
    response_lower = response.lower()

    # 1. Dangerous medication mentions
    for pattern in DANGEROUS_MED_PATTERNS:
        if re.search(pattern, response_lower, re.IGNORECASE):
            issues.append("พบการกล่าวถึงยาหรือสารเคมีที่อาจเป็นอันตราย" if language == Language.TH
                          else "Detected mention of potentially dangerous medication")
            break

    # 2. Overconfident / diagnostic language
    overconfident_list = OVERCONFIDENT_TH + OVERCONFIDENT_EN
    for phrase in overconfident_list:
        if phrase.lower() in response_lower:
            issues.append(f"พบคำพูดที่ overconfident: '{phrase}'" if language == Language.TH
                          else f"Detected overconfident claim: '{phrase}'")
            break

    # 3. Fabricated statistics
    stat_matches = FABRICATED_STAT_PATTERN.findall(response)
    if stat_matches:
        # Only flag if stats not derivable from emotion data
        if known_emotions is None or len(known_emotions) == 0:
            issues.append(f"พบสถิติที่ไม่สามารถตรวจสอบได้: {stat_matches}" if language == Language.TH
                          else f"Unverifiable statistics found: {stat_matches}")

    risk = "none"
    if issues:
        risk = "high" if any("ยา" in i or "medication" in i or "overconfident" in i.lower() for i in issues) else "low"

    result = HallucinationResult(
        is_clean=len(issues) == 0,
        issues=issues,
        risk_level=risk,
    )
    if not result.is_clean:
        logger.warning(f"[Hallucination Guard] risk={risk} issues={issues}")
    return result


def apply_hallucination_warning(
    response: str,
    result: HallucinationResult,
    language: Language = Language.TH,
) -> str:
    """Append hallucination warning if issues detected."""
    if not result.is_clean and result.risk_level == "high":
        warning = HALLUCINATION_WARNING_TH if language == Language.TH else HALLUCINATION_WARNING_EN
        return response + warning
    return response
