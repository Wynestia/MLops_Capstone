from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


# ─── Mood Analysis ────────────────────────────────────────────────────────────

class MoodAnalysisOut(BaseModel):
    id: str
    dog_id: str
    image_url: Optional[str]
    mood: str
    confidence: Optional[float]
    scores: Optional[dict]
    model_version: str
    analyzed_at: datetime

    model_config = {"from_attributes": True}


# ─── Mood Log ────────────────────────────────────────────────────────────────

class MoodLogCreate(BaseModel):
    mood: str               # Happy/Relaxed/Sad/Angry
    note: Optional[str] = None
    logged_at: Optional[datetime] = None


class MoodLogOut(BaseModel):
    id: str
    dog_id: str
    mood: str
    source: str
    note: Optional[str]
    logged_at: datetime

    model_config = {"from_attributes": True}


class MoodSummary(BaseModel):
    mood: str
    count: int
    percentage: float


# ─── Weight Log ──────────────────────────────────────────────────────────────

class WeightLogCreate(BaseModel):
    weight_kg: float
    recorded_at: date


class WeightLogOut(BaseModel):
    id: str
    dog_id: str
    weight_kg: float
    recorded_at: date
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Journal ─────────────────────────────────────────────────────────────────

class JournalCreate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None
    entry_date: date


class JournalUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None


class JournalOut(BaseModel):
    id: str
    dog_id: str
    content: Optional[str]
    mood: Optional[str]
    entry_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Medication ──────────────────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    name: str
    type: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"
    prescribed_by: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class MedicationUpdate(MedicationCreate):
    name: Optional[str] = None
    status: Optional[str] = None


class MedicationOut(BaseModel):
    id: str
    dog_id: str
    name: str
    type: Optional[str]
    dose: Optional[str]
    frequency: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    status: str
    prescribed_by: Optional[str]
    reason: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Health Record ───────────────────────────────────────────────────────────

class HealthRecordCreate(BaseModel):
    condition: str
    severity: Optional[str] = "medium"    # low/medium/high
    status: str = "ongoing"               # ongoing/monitoring/resolved
    diagnosed_date: Optional[date] = None
    notes: Optional[str] = None


class HealthRecordUpdate(BaseModel):
    condition: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    diagnosed_date: Optional[date] = None
    notes: Optional[str] = None


class HealthRecordOut(BaseModel):
    id: str
    dog_id: str
    condition: str
    severity: Optional[str]
    status: str
    diagnosed_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Vaccine ─────────────────────────────────────────────────────────────────

class VaccineCreate(BaseModel):
    name: str
    last_date: Optional[date] = None
    next_due: Optional[date] = None
    status: str = "current"   # current/due-soon/overdue


class VaccineUpdate(BaseModel):
    name: Optional[str] = None
    last_date: Optional[date] = None
    next_due: Optional[date] = None
    status: Optional[str] = None


class VaccineOut(BaseModel):
    id: str
    dog_id: str
    name: str
    last_date: Optional[date]
    next_due: Optional[date]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Activity Log ────────────────────────────────────────────────────────────

class ActivityLogCreate(BaseModel):
    logged_date: date
    walk_min: int = 0
    play_min: int = 0
    train_min: int = 0
    notes: Optional[str] = None


class ActivityLogOut(BaseModel):
    id: str
    dog_id: str
    logged_date: date
    walk_min: int
    play_min: int
    train_min: int
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessageIn(BaseModel):
    message: str
    analysis_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: str
    dog_id: str
    analysis_id: Optional[str]
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────

class AlertItem(BaseModel):
    type: str
    message: str


class DashboardOut(BaseModel):
    dog_id: str
    dog_name: str
    current_mood: Optional[str]
    current_confidence: Optional[float]
    week_mood: list[MoodLogOut]
    active_meds_count: int
    ongoing_health_count: int
    due_vaccine_count: int
    alerts: list[AlertItem]
    total_analyses: int
