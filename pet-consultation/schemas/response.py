from pydantic import BaseModel
from typing import Optional, List
from config.constants import AlertLevel


class TextResponse(BaseModel):
    session_id: str
    message: str
    alert_level: AlertLevel = AlertLevel.NONE
    has_medical_disclaimer: bool = False


class StructuredResponse(BaseModel):
    session_id: str
    summary: str
    emotion_label: str
    confidence: float
    recommendations: List[str]
    alert_level: AlertLevel = AlertLevel.NONE
    has_medical_disclaimer: bool = False


class AnalysisResponse(BaseModel):
    pet_id: str
    pet_name: str
    timeframe_days: int
    dominant_emotion: str
    emotion_distribution: dict
    trend: str              # "improving" / "declining" / "stable" / "fluctuating"
    anomalies: List[str]
    summary: str
    alert_level: AlertLevel = AlertLevel.NONE


class SummaryResponse(BaseModel):
    pet_id: str
    pet_name: str
    period: str
    summary: str
    highlights: List[str]
    alert_level: AlertLevel = AlertLevel.NONE


class HealthResponse(BaseModel):
    status: str
    model: str
    version: str = "1.0.0"
