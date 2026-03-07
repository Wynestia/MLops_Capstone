from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class DogCreate(BaseModel):
    name: str
    breed: Optional[str] = None
    birthday: Optional[date] = None
    sex: Optional[str] = None  # Male/Female/Unknown
    weight_kg: Optional[float] = None
    microchip: Optional[str] = None
    emoji: str = "\U0001F436"
    status: Optional[str] = None  # Happy/Relaxed/Sad/Angry
    energy_level: Optional[str] = None
    notes: Optional[str] = None


class DogUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    birthday: Optional[date] = None
    sex: Optional[str] = None
    weight_kg: Optional[float] = None
    microchip: Optional[str] = None
    emoji: Optional[str] = None
    status: Optional[str] = None
    energy_level: Optional[str] = None
    notes: Optional[str] = None


class DogOut(BaseModel):
    id: str
    user_id: str
    name: str
    breed: Optional[str]
    birthday: Optional[date]
    sex: Optional[str]
    weight_kg: Optional[float]
    microchip: Optional[str]
    emoji: str
    status: Optional[str]
    energy_level: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
