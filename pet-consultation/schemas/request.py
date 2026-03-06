from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from config.constants import Language, ResponseMode


class PetProfile(BaseModel):
    pet_id: str
    name: str
    species: str = "dog"          # dog / cat / rabbit / etc.
    breed: Optional[str] = None
    age_years: Optional[float] = None
    gender: Optional[str] = None  # male / female
    weight_kg: Optional[float] = None
    special_notes: Optional[str] = None  # ประวัติพิเศษ เช่น กลัวเสียงดัง


class EmotionRecord(BaseModel):
    timestamp: datetime
    emotion_label: str
    confidence: float = Field(ge=0.0, le=1.0)
    source: Optional[str] = "image"  # image / sensor / manual


class ChatRequest(BaseModel):
    session_id: str
    pet_profile: PetProfile
    user_message: str
    emotion_history: Optional[List[EmotionRecord]] = []
    language: Language = Language.TH
    response_mode: ResponseMode = ResponseMode.TEXT


class AnalyzeRequest(BaseModel):
    pet_profile: PetProfile
    emotion_history: List[EmotionRecord]
    timeframe_days: int = 7
    language: Language = Language.TH


class SummaryRequest(BaseModel):
    pet_profile: PetProfile
    emotion_history: List[EmotionRecord]
    period: str = "weekly"  # weekly / monthly
    language: Language = Language.TH
