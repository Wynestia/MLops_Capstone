from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.dog import Dog
from app.models.health import (
    MoodLog, MoodAnalysis, Medication, HealthRecord, Vaccine
)
from app.schemas.health import DashboardOut, AlertItem, MoodLogOut

router = APIRouter(tags=["Reports"])


async def _get_dog_or_404(dog_id: str, user: User, db: AsyncSession) -> Dog:
    result = await db.execute(select(Dog).where(Dog.id == dog_id, Dog.user_id == user.id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


@router.get("/dogs/{dog_id}/dashboard", response_model=DashboardOut)
async def get_dashboard(
    dog_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dog = await _get_dog_or_404(dog_id, current_user, db)
    since_7d = datetime.now(timezone.utc) - timedelta(days=7)

    # Week mood logs
    mood_result = await db.execute(
        select(MoodLog)
        .where(MoodLog.dog_id == dog_id, MoodLog.logged_at >= since_7d)
        .order_by(MoodLog.logged_at.asc())
    )
    week_moods = mood_result.scalars().all()

    # Current mood (latest)
    latest_analysis_result = await db.execute(
        select(MoodAnalysis)
        .where(MoodAnalysis.dog_id == dog_id)
        .order_by(MoodAnalysis.analyzed_at.desc())
        .limit(1)
    )
    latest_analysis = latest_analysis_result.scalar_one_or_none()

    # Active meds count
    med_count_result = await db.execute(
        select(func.count()).where(Medication.dog_id == dog_id, Medication.status == "active")
    )
    active_meds_count = med_count_result.scalar()

    # Ongoing health count
    health_count_result = await db.execute(
        select(func.count()).where(
            HealthRecord.dog_id == dog_id,
            HealthRecord.status.in_(["ongoing", "monitoring"])
        )
    )
    ongoing_health_count = health_count_result.scalar()

    # Due vaccines
    today = date.today()
    due_soon = today + timedelta(days=30)
    vaccine_count_result = await db.execute(
        select(func.count()).where(
            Vaccine.dog_id == dog_id,
            Vaccine.next_due <= due_soon,
            Vaccine.next_due >= today,
        )
    )
    due_vaccine_count = vaccine_count_result.scalar()

    # Total analyses
    total_analyses_result = await db.execute(
        select(func.count()).where(MoodAnalysis.dog_id == dog_id)
    )
    total_analyses = total_analyses_result.scalar()

    # Build alerts
    alerts: list[AlertItem] = []

    # Alert: sad mood consecutive days
    sad_days = [m for m in week_moods if m.mood == "Sad"]
    if len(sad_days) >= 2:
        alerts.append(AlertItem(
            type="mood",
            message=f"{dog.name} has been sad for {len(sad_days)} days this week"
        ))

    # Alert: due vaccines
    if due_vaccine_count > 0:
        alerts.append(AlertItem(
            type="vaccine",
            message=f"{due_vaccine_count} vaccine(s) due within 30 days for {dog.name}"
        ))

    return DashboardOut(
        dog_id=dog_id,
        dog_name=dog.name,
        current_mood=latest_analysis.mood if latest_analysis else None,
        current_confidence=float(latest_analysis.confidence) if latest_analysis and latest_analysis.confidence else None,
        week_mood=[MoodLogOut.model_validate(m) for m in week_moods],
        active_meds_count=active_meds_count or 0,
        ongoing_health_count=ongoing_health_count or 0,
        due_vaccine_count=due_vaccine_count or 0,
        alerts=alerts,
        total_analyses=total_analyses or 0,
    )


@router.get("/dogs/{dog_id}/reports/monthly")
async def monthly_report(
    dog_id: str,
    month: str = Query(default=None, description="YYYY-MM format, e.g. 2026-03"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dog = await _get_dog_or_404(dog_id, current_user, db)

    if month:
        year, mon = map(int, month.split("-"))
    else:
        now = datetime.now(timezone.utc)
        year, mon = now.year, now.month

    start = datetime(year, mon, 1, tzinfo=timezone.utc)
    # End of month
    if mon == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, mon + 1, 1, tzinfo=timezone.utc)

    # Mood distribution
    mood_result = await db.execute(
        select(MoodLog.mood, func.count(MoodLog.id).label("count"))
        .where(MoodLog.dog_id == dog_id, MoodLog.logged_at.between(start, end))
        .group_by(MoodLog.mood)
    )
    mood_distribution = {row.mood: row.count for row in mood_result.all()}

    # Analysis count
    analysis_count_result = await db.execute(
        select(func.count()).where(
            MoodAnalysis.dog_id == dog_id,
            MoodAnalysis.analyzed_at.between(start, end)
        )
    )
    analysis_count = analysis_count_result.scalar()

    return {
        "dog_id": dog_id,
        "dog_name": dog.name,
        "month": f"{year}-{mon:02d}",
        "mood_distribution": mood_distribution,
        "total_analyses": analysis_count or 0,
        "happy_days": mood_distribution.get("Happy", 0),
        "alerts_triggered": len([v for v in mood_distribution.values()
                                  if mood_distribution.get("Sad", 0) >= 2]),
    }
