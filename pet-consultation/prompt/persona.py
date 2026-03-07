from schemas.request import PetProfile
from config.constants import Language
from prompt.templates import PERSONA_TEMPLATE_TH, PERSONA_TEMPLATE_EN


def build_pet_persona(profile: PetProfile, language: Language = Language.TH) -> str:
    """สร้าง persona string จาก PetProfile"""
    template = PERSONA_TEMPLATE_TH if language == Language.TH else PERSONA_TEMPLATE_EN

    age_str = f"{profile.age_years}" if profile.age_years else "ไม่ระบุ" if language == Language.TH else "unknown"
    gender_map_th = {"male": "เพศผู้", "female": "เพศเมีย"}
    gender_str = gender_map_th.get(profile.gender or "", profile.gender or "ไม่ระบุ") if language == Language.TH else (profile.gender or "unknown")
    weight_str = f"{profile.weight_kg}" if profile.weight_kg else ("ไม่ระบุ" if language == Language.TH else "unknown")
    breed_str = profile.breed or ("ไม่ระบุ" if language == Language.TH else "unknown")
    notes_str = profile.special_notes or ("ไม่มี" if language == Language.TH else "none")

    return template.format(
        name=profile.name,
        species=profile.species,
        breed=breed_str,
        age=age_str,
        gender=gender_str,
        weight=weight_str,
        notes=notes_str,
    )
