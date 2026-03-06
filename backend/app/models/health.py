import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Numeric, Date, ForeignKey, Text, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class MoodAnalysis(Base):
    """ML-generated emotion analysis result from dog photo."""
    __tablename__ = "mood_analyses"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str | None] = mapped_column(Text)
    mood: Mapped[str] = mapped_column(String(20), nullable=False)       # Happy/Relaxed/Sad/Angry
    confidence: Mapped[float | None] = mapped_column(Numeric(5, 2))     # 0–100
    scores: Mapped[dict | None] = mapped_column(JSONB)                  # {"Happy":92,"Relaxed":5,...}
    model_version: Mapped[str] = mapped_column(String(20), default="v1")
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="mood_analyses")
    chat_messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="analysis")


class MoodLog(Base):
    """Daily mood entries (manual or auto-created from analysis)."""
    __tablename__ = "mood_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    mood: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(20), default="manual")  # manual | analysis
    note: Mapped[str | None] = mapped_column(Text)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="mood_logs")


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    weight_kg: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="weight_logs")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str | None] = mapped_column(Text)
    mood: Mapped[str | None] = mapped_column(String(20))
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="journal_entries")


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str | None] = mapped_column(String(100))
    dose: Mapped[str | None] = mapped_column(String(100))
    frequency: Mapped[str | None] = mapped_column(String(100))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active/completed/discontinued
    prescribed_by: Mapped[str | None] = mapped_column(String(100))
    reason: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="medications")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    condition: Mapped[str] = mapped_column(String(200), nullable=False)
    severity: Mapped[str | None] = mapped_column(String(10))    # low/medium/high
    status: Mapped[str] = mapped_column(String(20), default="ongoing")  # ongoing/monitoring/resolved
    diagnosed_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="health_records")


class Vaccine(Base):
    __tablename__ = "vaccines"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    last_date: Mapped[date | None] = mapped_column(Date)
    next_due: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="current")  # current/due-soon/overdue
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="vaccines")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    logged_date: Mapped[date] = mapped_column(Date, nullable=False)
    walk_min: Mapped[int] = mapped_column(Integer, default=0)
    play_min: Mapped[int] = mapped_column(Integer, default=0)
    train_min: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="activity_logs")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    dog_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    analysis_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("mood_analyses.id", ondelete="SET NULL"))
    role: Mapped[str] = mapped_column(String(20), nullable=False)       # user | assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped["Dog"] = relationship("Dog", back_populates="chat_messages")
    analysis: Mapped["MoodAnalysis | None"] = relationship("MoodAnalysis", back_populates="chat_messages")
