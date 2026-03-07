from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.dog import Dog
from app.models.health import MoodLog
from app.schemas.health import MoodLogCreate, MoodLogOut, MoodSummary

router = APIRouter(prefix="/dogs", tags=["Moods"])


async def _get_dog_or_404(dog_id: str, user: User, db: AsyncSession) -> Dog:
    result = await db.execute(select(Dog).where(Dog.id == dog_id, Dog.user_id == user.id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


@router.get("/{dog_id}/moods", response_model=list[MoodLogOut])
async def list_moods(
    dog_id: str,
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(MoodLog)
        .where(MoodLog.dog_id == dog_id, MoodLog.logged_at >= since)
        .order_by(MoodLog.logged_at.desc())
    )
    return [MoodLogOut.model_validate(m) for m in result.scalars().all()]


@router.post("/{dog_id}/moods", response_model=MoodLogOut, status_code=201)
async def create_mood_log(
    dog_id: str,
    body: MoodLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dog = await _get_dog_or_404(dog_id, current_user, db)

    valid_moods = {"Happy", "Relaxed", "Sad", "Angry"}
    if body.mood not in valid_moods:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Must be one of: {valid_moods}")

    log = MoodLog(
        dog_id=dog_id,
        mood=body.mood,
        source="manual",
        note=body.note,
        logged_at=body.logged_at or datetime.now(timezone.utc),
    )
    db.add(log)
    dog.status = body.mood
    await db.flush()
    await db.refresh(log)
    return MoodLogOut.model_validate(log)


@router.get("/{dog_id}/moods/summary", response_model=list[MoodSummary])
async def mood_summary(
    dog_id: str,
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(MoodLog.mood, func.count(MoodLog.id).label("count"))
        .where(MoodLog.dog_id == dog_id, MoodLog.logged_at >= since)
        .group_by(MoodLog.mood)
    )
    rows = result.all()
    total = sum(r.count for r in rows)
    if total == 0:
        return []
    return [
        MoodSummary(mood=r.mood, count=r.count, percentage=round(r.count / total * 100, 1))
        for r in rows
    ]
