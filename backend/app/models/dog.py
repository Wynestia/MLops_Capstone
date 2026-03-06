import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Numeric, Date, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Dog(Base):
    __tablename__ = "dogs"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    breed: Mapped[str | None] = mapped_column(String(100))
    birthday: Mapped[date | None] = mapped_column(Date)
    sex: Mapped[str | None] = mapped_column(String(10))          # Male/Female/Unknown
    weight_kg: Mapped[float | None] = mapped_column(Numeric(5, 2))
    microchip: Mapped[str | None] = mapped_column(String(50))
    emoji: Mapped[str] = mapped_column(String(10), default="🐕")
    energy_level: Mapped[str | None] = mapped_column(String(10)) # Low/Medium/High
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    mood_analyses: Mapped[list["MoodAnalysis"]] = relationship(
        "MoodAnalysis", back_populates="dog", cascade="all, delete-orphan"
    )
    mood_logs: Mapped[list["MoodLog"]] = relationship(
        "MoodLog", back_populates="dog", cascade="all, delete-orphan"
    )
    weight_logs: Mapped[list["WeightLog"]] = relationship(
        "WeightLog", back_populates="dog", cascade="all, delete-orphan"
    )
    journal_entries: Mapped[list["JournalEntry"]] = relationship(
        "JournalEntry", back_populates="dog", cascade="all, delete-orphan"
    )
    medications: Mapped[list["Medication"]] = relationship(
        "Medication", back_populates="dog", cascade="all, delete-orphan"
    )
    health_records: Mapped[list["HealthRecord"]] = relationship(
        "HealthRecord", back_populates="dog", cascade="all, delete-orphan"
    )
    vaccines: Mapped[list["Vaccine"]] = relationship(
        "Vaccine", back_populates="dog", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(
        "ActivityLog", back_populates="dog", cascade="all, delete-orphan"
    )
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="dog", cascade="all, delete-orphan"
    )
