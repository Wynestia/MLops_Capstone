from datetime import datetime, timezone, timedelta, date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.dog import Dog
from app.models.health import (
    ActivityLog,
    ChatThread,
    ChatMessage,
    HealthRecord,
    JournalEntry,
    Medication,
    MoodAnalysis,
    MoodLog,
    Vaccine,
    WeightLog,
)
from app.models.user import User
from app.schemas.health import (
    ChatMessageIn,
    ChatMessageOut,
    ChatThreadCreate,
    ChatThreadOut,
)
from app.services.chat_service import chat_service

router = APIRouter(prefix="/dogs", tags=["Chat"])


def _safe_float(value):
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def _compact_terms(values: list[str]) -> list[str]:
    seen = set()
    out = []
    for raw in values:
        value = str(raw or "").strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return out


def _normalize_sex(value: str | None) -> str:
    raw = str(value or "").strip()
    if not raw:
        return "unknown"

    key = raw.lower()
    male_tokens = {
        "male", "m", "boy", "man",
        "เพศผู้", "ตัวผู้", "ผู้",
        "雄", "公", "♂",
    }
    female_tokens = {
        "female", "f", "girl", "woman",
        "เพศเมีย", "ตัวเมีย", "เมีย",
        "雌", "母", "♀",
    }

    if key in male_tokens or raw in male_tokens:
        return "male"
    if key in female_tokens or raw in female_tokens:
        return "female"
    return "unknown"


DEFAULT_THREAD_TITLE = "New chat"


def _normalize_thread_title(title: str | None) -> str:
    text = str(title or "").strip()
    if not text:
        return DEFAULT_THREAD_TITLE
    if len(text) > 120:
        text = text[:120].rstrip()
    return text


async def _get_thread_or_404(dog_id: str, thread_id: str, db: AsyncSession) -> ChatThread:
    result = await db.execute(
        select(ChatThread).where(ChatThread.id == thread_id, ChatThread.dog_id == dog_id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Chat thread not found")
    return thread


async def _get_or_create_active_thread(
    dog_id: str,
    requested_thread_id: str | None,
    db: AsyncSession,
) -> ChatThread:
    if requested_thread_id:
        return await _get_thread_or_404(dog_id, requested_thread_id, db)

    latest_result = await db.execute(
        select(ChatThread)
        .where(ChatThread.dog_id == dog_id)
        .order_by(ChatThread.last_message_at.desc(), ChatThread.created_at.desc())
        .limit(1)
    )
    latest = latest_result.scalar_one_or_none()
    if latest:
        return latest

    thread = ChatThread(
        dog_id=dog_id,
        title=DEFAULT_THREAD_TITLE,
        last_message_at=datetime.now(timezone.utc),
    )
    db.add(thread)
    await db.flush()
    return thread


async def _get_dog_or_404(dog_id: str, user: User, db: AsyncSession) -> Dog:
    result = await db.execute(select(Dog).where(Dog.id == dog_id, Dog.user_id == user.id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


async def _build_dog_context(dog: Dog, db: AsyncSession) -> dict:
    """Build rich context for LLM from dog's data."""
    since_14d = datetime.now(timezone.utc) - timedelta(days=14)

    # Recent mood logs
    mood_result = await db.execute(
        select(MoodLog)
        .where(MoodLog.dog_id == dog.id, MoodLog.logged_at >= since_14d)
        .order_by(MoodLog.logged_at.desc())
        .limit(14)
    )
    mood_logs = mood_result.scalars().all()
    mood_history = [
        {
            "logged_at": m.logged_at.isoformat() if m.logged_at else "",
            "mood": m.mood,
            "source": m.source or "unknown",
            "note": m.note or "",
        }
        for m in mood_logs
    ]

    # Latest analyses
    analysis_result = await db.execute(
        select(MoodAnalysis)
        .where(MoodAnalysis.dog_id == dog.id)
        .order_by(MoodAnalysis.analyzed_at.desc())
        .limit(10)
    )
    analyses = analysis_result.scalars().all()
    analysis_history = [
        {
            "analyzed_at": a.analyzed_at.isoformat() if a.analyzed_at else "",
            "mood": a.mood,
            "confidence": round(_safe_float(a.confidence) or 0.0, 2),
            "model_version": a.model_version or "",
        }
        for a in analyses
    ]
    latest_analysis = analysis_history[0] if analysis_history else None

    # Weight history
    weight_result = await db.execute(
        select(WeightLog)
        .where(WeightLog.dog_id == dog.id)
        .order_by(WeightLog.recorded_at.desc())
        .limit(12)
    )
    weight_logs = weight_result.scalars().all()
    weight_history = [
        {
            "recorded_at": str(w.recorded_at),
            "weight_kg": round(_safe_float(w.weight_kg) or 0.0, 2),
        }
        for w in weight_logs
    ]
    latest_weight_kg = (
        weight_history[0]["weight_kg"]
        if weight_history
        else _safe_float(dog.weight_kg)
    )

    # Activity history
    activity_result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.dog_id == dog.id)
        .order_by(ActivityLog.logged_date.desc())
        .limit(14)
    )
    activity_history = [
        {
            "logged_date": str(a.logged_date),
            "walk_min": int(a.walk_min or 0),
            "play_min": int(a.play_min or 0),
            "train_min": int(a.train_min or 0),
            "notes": a.notes or "",
        }
        for a in activity_result.scalars().all()
    ]

    # Medications (latest records)
    med_result = await db.execute(
        select(Medication)
        .where(Medication.dog_id == dog.id)
        .order_by(Medication.created_at.desc())
        .limit(20)
    )
    medications = [
        {
            "name": m.name,
            "type": m.type or "",
            "dose": m.dose or "",
            "frequency": m.frequency or "",
            "status": m.status or "",
            "start_date": str(m.start_date) if m.start_date else "",
            "end_date": str(m.end_date) if m.end_date else "",
            "reason": m.reason or "",
            "notes": m.notes or "",
        }
        for m in med_result.scalars().all()
    ]

    # Health records (latest records)
    health_result = await db.execute(
        select(HealthRecord)
        .where(HealthRecord.dog_id == dog.id)
        .order_by(HealthRecord.created_at.desc())
        .limit(20)
    )
    health_records = [
        {
            "condition": r.condition,
            "severity": r.severity or "",
            "status": r.status or "",
            "diagnosed_date": str(r.diagnosed_date) if r.diagnosed_date else "",
            "notes": r.notes or "",
        }
        for r in health_result.scalars().all()
    ]

    # Vaccines
    vaccine_result = await db.execute(
        select(Vaccine)
        .where(Vaccine.dog_id == dog.id)
        .order_by(Vaccine.created_at.desc())
        .limit(20)
    )
    vaccines = [
        {
            "name": v.name,
            "status": v.status or "",
            "last_date": str(v.last_date) if v.last_date else "",
            "next_due": str(v.next_due) if v.next_due else "",
        }
        for v in vaccine_result.scalars().all()
    ]

    # Recent journal entries
    journal_result = await db.execute(
        select(JournalEntry)
        .where(
            JournalEntry.dog_id == dog.id,
            JournalEntry.entry_date >= (date.today() - timedelta(days=90)),
        )
        .order_by(JournalEntry.entry_date.desc())
        .limit(20)
    )
    journal_entries = [
        {
            "entry_date": str(j.entry_date),
            "mood": j.mood or "",
            "content": j.content or "",
        }
        for j in journal_result.scalars().all()
    ]

    # Calculate age
    age = None
    if dog.birthday:
        today = date.today()
        age = today.year - dog.birthday.year - (
            (today.month, today.day) < (dog.birthday.month, dog.birthday.day)
        )

    canonical_terms = _compact_terms(
        [
            dog.name,
            dog.breed,
            dog.microchip,
            *[m.get("name") for m in medications],
            *[v.get("name") for v in vaccines],
        ]
    )

    return {
        "name": dog.name,
        "breed": dog.breed or "mixed breed",
        "age": age if age is not None else "unknown",
        "birthday": str(dog.birthday) if dog.birthday else "unknown",
        "latest_weight_kg": latest_weight_kg if latest_weight_kg is not None else "unknown",
        "sex": _normalize_sex(dog.sex),
        "energy_level": dog.energy_level or "medium",
        "microchip": dog.microchip or "unknown",
        "notes": dog.notes or "none",
        "current_status": dog.status or "unknown",
        "latest_analysis": latest_analysis,
        "mood_history": mood_history,
        "analysis_history": analysis_history,
        "weight_history": weight_history,
        "activity_history": activity_history,
        "medications": medications,
        "health_records": health_records,
        "vaccines": vaccines,
        "journal_entries": journal_entries,
        "canonical_terms": canonical_terms,
    }


@router.get("/{dog_id}/chat-threads", response_model=list[ChatThreadOut])
async def list_chat_threads(
    dog_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(
        select(ChatThread)
        .where(ChatThread.dog_id == dog_id)
        .order_by(ChatThread.last_message_at.desc(), ChatThread.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = list(result.scalars().all())
    return [ChatThreadOut.model_validate(row) for row in rows]


@router.post("/{dog_id}/chat-threads", response_model=ChatThreadOut, status_code=201)
async def create_chat_thread(
    dog_id: str,
    body: ChatThreadCreate | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    thread = ChatThread(
        dog_id=dog_id,
        title=_normalize_thread_title((body.title if body else None)),
        last_message_at=datetime.now(timezone.utc),
    )
    db.add(thread)
    await db.flush()
    await db.refresh(thread)
    return ChatThreadOut.model_validate(thread)


@router.get("/{dog_id}/chat", response_model=list[ChatMessageOut])
async def get_chat_history(
    dog_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    thread_id: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)

    target_thread: ChatThread | None = None
    if thread_id:
        target_thread = await _get_thread_or_404(dog_id, thread_id, db)
    else:
        latest_result = await db.execute(
            select(ChatThread)
            .where(ChatThread.dog_id == dog_id)
            .order_by(ChatThread.last_message_at.desc(), ChatThread.created_at.desc())
            .limit(1)
        )
        target_thread = latest_result.scalar_one_or_none()

    query = (
        select(ChatMessage)
        .where(ChatMessage.dog_id == dog_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if target_thread:
        query = query.where(ChatMessage.thread_id == target_thread.id)
    else:
        query = query.where(ChatMessage.thread_id.is_(None))

    result = await db.execute(query)
    rows = list(result.scalars().all())
    rows.reverse()
    return [ChatMessageOut.model_validate(m) for m in rows]


@router.post("/{dog_id}/chat", response_model=ChatMessageOut)
async def send_message(
    dog_id: str,
    body: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dog = await _get_dog_or_404(dog_id, current_user, db)
    thread = await _get_or_create_active_thread(dog_id, body.thread_id, db)

    # Fetch conversation history first (without the incoming user message).
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.dog_id == dog_id, ChatMessage.thread_id == thread.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    history_rows = list(history_result.scalars().all())
    history_rows.reverse()
    conversation_history = [
        {"role": m.role, "content": m.content}
        for m in history_rows
    ]

    # Save user message
    user_msg = ChatMessage(
        dog_id=dog_id,
        thread_id=thread.id,
        analysis_id=body.analysis_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.flush()

    # Build context from DB
    dog_context = await _build_dog_context(dog, db)

    # Call AI service
    ai_response = await chat_service.chat(
        user_message=body.message,
        conversation_history=conversation_history,
        dog_context=dog_context,
        response_mode=body.response_mode,
    )

    if thread.title.strip().lower() in {"", "new chat", "new chat."}:
        suggested_title = await chat_service.suggest_conversation_title(
            first_message=body.message,
            dog_name=dog.name or "your dog",
            assistant_reply=ai_response,
        )
        thread.title = _normalize_thread_title(suggested_title)

    # Save assistant reply
    assistant_msg = ChatMessage(
        dog_id=dog_id,
        thread_id=thread.id,
        analysis_id=body.analysis_id,
        role="assistant",
        content=ai_response,
    )
    db.add(assistant_msg)
    thread.last_message_at = datetime.now(timezone.utc)
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
    await db.execute(delete(ChatMessage).where(ChatMessage.dog_id == dog_id))
    await db.execute(delete(ChatThread).where(ChatThread.dog_id == dog_id))
