from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.dog import Dog
from app.models.health import ChatMessage, MoodLog, Medication, HealthRecord, JournalEntry
from app.schemas.health import ChatMessageIn, ChatMessageOut
from app.services.chat_service import chat_service

router = APIRouter(prefix="/dogs", tags=["Chat"])


async def _get_dog_or_404(dog_id: str, user: User, db: AsyncSession) -> Dog:
    result = await db.execute(select(Dog).where(Dog.id == dog_id, Dog.user_id == user.id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


async def _build_dog_context(dog: Dog, db: AsyncSession) -> dict:
    """Build context for LLM from dog's recent data."""
    from datetime import date

    since_7d = datetime.now(timezone.utc) - timedelta(days=7)
    since_30d = datetime.now(timezone.utc) - timedelta(days=30)

    # Recent mood
    mood_result = await db.execute(
        select(MoodLog).where(MoodLog.dog_id == dog.id, MoodLog.logged_at >= since_7d)
        .order_by(MoodLog.logged_at.desc()).limit(7)
    )
    mood_history = [
        {"logged_at": str(m.logged_at.date()), "mood": m.mood, "note": m.note or ""}
        for m in mood_result.scalars().all()
    ]

    # Active medications
    med_result = await db.execute(
        select(Medication).where(Medication.dog_id == dog.id, Medication.status == "active")
    )
    medications = [
        {"name": m.name, "dose": m.dose or "", "frequency": m.frequency or ""}
        for m in med_result.scalars().all()
    ]

    # Ongoing health records
    health_result = await db.execute(
        select(HealthRecord).where(
            HealthRecord.dog_id == dog.id,
            HealthRecord.status.in_(["ongoing", "monitoring"])
        )
    )
    health_records = [
        {"condition": r.condition, "severity": r.severity or "", "status": r.status}
        for r in health_result.scalars().all()
    ]

    # Recent journal entries
    journal_result = await db.execute(
        select(JournalEntry).where(
            JournalEntry.dog_id == dog.id,
            JournalEntry.entry_date >= (date.today() - timedelta(days=30))
        ).order_by(JournalEntry.entry_date.desc()).limit(5)
    )
    journal_entries = [
        {"entry_date": str(j.entry_date), "content": j.content or ""}
        for j in journal_result.scalars().all()
    ]

    # Calculate age
    age = None
    if dog.birthday:
        today = date.today()
        age = today.year - dog.birthday.year - (
            (today.month, today.day) < (dog.birthday.month, dog.birthday.day)
        )

    return {
        "name": dog.name,
        "breed": dog.breed or "mixed breed",
        "age": age or dog.notes or "unknown",
        "weight_kg": dog.weight_kg or "unknown",
        "sex": dog.sex or "unknown",
        "energy_level": dog.energy_level or "medium",
        "mood_history": mood_history,
        "medications": medications,
        "health_records": health_records,
        "journal_entries": journal_entries,
    }


@router.get("/{dog_id}/chat", response_model=list[ChatMessageOut])
async def get_chat_history(
    dog_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.dog_id == dog_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    return [ChatMessageOut.model_validate(m) for m in result.scalars().all()]


@router.post("/{dog_id}/chat", response_model=ChatMessageOut)
async def send_message(
    dog_id: str,
    body: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dog = await _get_dog_or_404(dog_id, current_user, db)

    # Save user message
    user_msg = ChatMessage(
        dog_id=dog_id,
        analysis_id=body.analysis_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.flush()

    # Build context from DB
    dog_context = await _build_dog_context(dog, db)

    # Fetch conversation history for context
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.dog_id == dog_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
    )
    conversation_history = [
        {"role": m.role, "content": m.content}
        for m in history_result.scalars().all()
    ]

    # Call AI service
    ai_response = await chat_service.chat(
        user_message=body.message,
        conversation_history=conversation_history,
        dog_context=dog_context,
    )

    # Save assistant reply
    assistant_msg = ChatMessage(
        dog_id=dog_id,
        analysis_id=body.analysis_id,
        role="assistant",
        content=ai_response,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)

    return ChatMessageOut.model_validate(assistant_msg)


@router.delete("/{dog_id}/chat", status_code=204)
async def clear_chat(
    dog_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(ChatMessage).where(ChatMessage.dog_id == dog_id))
    for msg in result.scalars().all():
        await db.delete(msg)
