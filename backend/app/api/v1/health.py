from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.dog import Dog
from app.models.health import (
    WeightLog, JournalEntry, Medication, HealthRecord, Vaccine, ActivityLog
)
from app.schemas.health import (
    WeightLogCreate, WeightLogOut,
    JournalCreate, JournalUpdate, JournalOut,
    MedicationCreate, MedicationUpdate, MedicationOut,
    HealthRecordCreate, HealthRecordUpdate, HealthRecordOut,
    VaccineCreate, VaccineUpdate, VaccineOut,
    ActivityLogCreate, ActivityLogOut,
)

router = APIRouter(prefix="/dogs", tags=["Health"])


async def _get_dog_or_404(dog_id: str, user: User, db: AsyncSession) -> Dog:
    result = await db.execute(select(Dog).where(Dog.id == dog_id, Dog.user_id == user.id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


# ─── Weight Logs ─────────────────────────────────────────────────────────────

@router.get("/{dog_id}/weights", response_model=list[WeightLogOut])
async def list_weights(dog_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(WeightLog).where(WeightLog.dog_id == dog_id).order_by(WeightLog.recorded_at.desc()))
    return [WeightLogOut.model_validate(w) for w in result.scalars().all()]


@router.post("/{dog_id}/weights", response_model=WeightLogOut, status_code=201)
async def create_weight(dog_id: str, body: WeightLogCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    log = WeightLog(dog_id=dog_id, **body.model_dump())
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return WeightLogOut.model_validate(log)


@router.delete("/{dog_id}/weights/{log_id}", status_code=204)
async def delete_weight(dog_id: str, log_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(WeightLog).where(WeightLog.id == log_id, WeightLog.dog_id == dog_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(404, "Record not found")
    await db.delete(log)


# ─── Journal ─────────────────────────────────────────────────────────────────

@router.get("/{dog_id}/journal", response_model=list[JournalOut])
async def list_journal(dog_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(JournalEntry).where(JournalEntry.dog_id == dog_id).order_by(JournalEntry.entry_date.desc()))
    return [JournalOut.model_validate(j) for j in result.scalars().all()]


@router.post("/{dog_id}/journal", response_model=JournalOut, status_code=201)
async def create_journal(dog_id: str, body: JournalCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    entry = JournalEntry(dog_id=dog_id, **body.model_dump())
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return JournalOut.model_validate(entry)


@router.put("/{dog_id}/journal/{entry_id}", response_model=JournalOut)
async def update_journal(dog_id: str, entry_id: str, body: JournalUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.dog_id == dog_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Entry not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    await db.flush()
    await db.refresh(entry)
    return JournalOut.model_validate(entry)


@router.delete("/{dog_id}/journal/{entry_id}", status_code=204)
async def delete_journal(dog_id: str, entry_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.dog_id == dog_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Entry not found")
    await db.delete(entry)


# ─── Medications ─────────────────────────────────────────────────────────────

@router.get("/{dog_id}/medications", response_model=list[MedicationOut])
async def list_medications(dog_id: str, status: str = None, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    q = select(Medication).where(Medication.dog_id == dog_id)
    if status:
        q = q.where(Medication.status == status)
    result = await db.execute(q.order_by(Medication.created_at.desc()))
    return [MedicationOut.model_validate(m) for m in result.scalars().all()]


@router.post("/{dog_id}/medications", response_model=MedicationOut, status_code=201)
async def create_medication(dog_id: str, body: MedicationCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    med = Medication(dog_id=dog_id, **body.model_dump())
    db.add(med)
    await db.flush()
    await db.refresh(med)
    return MedicationOut.model_validate(med)


@router.put("/{dog_id}/medications/{med_id}", response_model=MedicationOut)
async def update_medication(dog_id: str, med_id: str, body: MedicationUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(Medication).where(Medication.id == med_id, Medication.dog_id == dog_id))
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(404, "Medication not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(med, k, v)
    await db.flush()
    await db.refresh(med)
    return MedicationOut.model_validate(med)


@router.delete("/{dog_id}/medications/{med_id}", status_code=204)
async def delete_medication(dog_id: str, med_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(Medication).where(Medication.id == med_id, Medication.dog_id == dog_id))
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(404, "Medication not found")
    await db.delete(med)


# ─── Health Records ───────────────────────────────────────────────────────────

@router.get("/{dog_id}/health", response_model=list[HealthRecordOut])
async def list_health(dog_id: str, status: str = None, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    q = select(HealthRecord).where(HealthRecord.dog_id == dog_id)
    if status:
        q = q.where(HealthRecord.status == status)
    result = await db.execute(q.order_by(HealthRecord.created_at.desc()))
    return [HealthRecordOut.model_validate(r) for r in result.scalars().all()]


@router.post("/{dog_id}/health", response_model=HealthRecordOut, status_code=201)
async def create_health(dog_id: str, body: HealthRecordCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    record = HealthRecord(dog_id=dog_id, **body.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return HealthRecordOut.model_validate(record)


@router.put("/{dog_id}/health/{record_id}", response_model=HealthRecordOut)
async def update_health(dog_id: str, record_id: str, body: HealthRecordUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(HealthRecord).where(HealthRecord.id == record_id, HealthRecord.dog_id == dog_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Record not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(record, k, v)
    await db.flush()
    await db.refresh(record)
    return HealthRecordOut.model_validate(record)


@router.delete("/{dog_id}/health/{record_id}", status_code=204)
async def delete_health(dog_id: str, record_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(HealthRecord).where(HealthRecord.id == record_id, HealthRecord.dog_id == dog_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Record not found")
    await db.delete(record)


# ─── Vaccines ────────────────────────────────────────────────────────────────

@router.get("/{dog_id}/vaccines", response_model=list[VaccineOut])
async def list_vaccines(dog_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(Vaccine).where(Vaccine.dog_id == dog_id).order_by(Vaccine.next_due))
    return [VaccineOut.model_validate(v) for v in result.scalars().all()]


@router.post("/{dog_id}/vaccines", response_model=VaccineOut, status_code=201)
async def create_vaccine(dog_id: str, body: VaccineCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    vaccine = Vaccine(dog_id=dog_id, **body.model_dump())
    db.add(vaccine)
    await db.flush()
    await db.refresh(vaccine)
    return VaccineOut.model_validate(vaccine)


@router.put("/{dog_id}/vaccines/{vaccine_id}", response_model=VaccineOut)
async def update_vaccine(dog_id: str, vaccine_id: str, body: VaccineUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(Vaccine).where(Vaccine.id == vaccine_id, Vaccine.dog_id == dog_id))
    vaccine = result.scalar_one_or_none()
    if not vaccine:
        raise HTTPException(404, "Vaccine not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(vaccine, k, v)
    await db.flush()
    await db.refresh(vaccine)
    return VaccineOut.model_validate(vaccine)


@router.delete("/{dog_id}/vaccines/{vaccine_id}", status_code=204)
async def delete_vaccine(dog_id: str, vaccine_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(Vaccine).where(Vaccine.id == vaccine_id, Vaccine.dog_id == dog_id))
    vaccine = result.scalar_one_or_none()
    if not vaccine:
        raise HTTPException(404, "Vaccine not found")
    await db.delete(vaccine)


# ─── Activities ──────────────────────────────────────────────────────────────

@router.get("/{dog_id}/activities", response_model=list[ActivityLogOut])
async def list_activities(dog_id: str, limit: int = 14, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(ActivityLog).where(ActivityLog.dog_id == dog_id).order_by(ActivityLog.logged_date.desc()).limit(limit))
    return [ActivityLogOut.model_validate(a) for a in result.scalars().all()]


@router.post("/{dog_id}/activities", response_model=ActivityLogOut, status_code=201)
async def create_activity(dog_id: str, body: ActivityLogCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    log = ActivityLog(dog_id=dog_id, **body.model_dump())
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return ActivityLogOut.model_validate(log)


@router.put("/{dog_id}/activities/{log_id}", response_model=ActivityLogOut)
async def update_activity(dog_id: str, log_id: str, body: ActivityLogCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(select(ActivityLog).where(ActivityLog.id == log_id, ActivityLog.dog_id == dog_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(404, "Activity log not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(log, k, v)
    await db.flush()
    await db.refresh(log)
    return ActivityLogOut.model_validate(log)
