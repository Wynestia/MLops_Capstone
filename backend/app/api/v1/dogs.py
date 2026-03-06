from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.dog import Dog
from app.schemas.dog import DogCreate, DogUpdate, DogOut

router = APIRouter(prefix="/dogs", tags=["Dogs"])


def _check_dog_owner(dog: Dog, user: User):
    if dog.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this dog")


@router.get("", response_model=list[DogOut])
async def list_dogs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dog).where(Dog.user_id == current_user.id).order_by(Dog.created_at)
    )
    return [DogOut.model_validate(d) for d in result.scalars().all()]


@router.post("", response_model=DogOut, status_code=201)
async def create_dog(
    body: DogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dog = Dog(**body.model_dump(), user_id=current_user.id)
    db.add(dog)
    await db.flush()
    await db.refresh(dog)
    return DogOut.model_validate(dog)


@router.get("/{dog_id}", response_model=DogOut)
async def get_dog(
    dog_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dog).where(Dog.id == dog_id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    _check_dog_owner(dog, current_user)
    return DogOut.model_validate(dog)


@router.put("/{dog_id}", response_model=DogOut)
async def update_dog(
    dog_id: str,
    body: DogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dog).where(Dog.id == dog_id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    _check_dog_owner(dog, current_user)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(dog, field, value)

    await db.flush()
    await db.refresh(dog)
    return DogOut.model_validate(dog)


@router.delete("/{dog_id}", status_code=204)
async def delete_dog(
    dog_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dog).where(Dog.id == dog_id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    _check_dog_owner(dog, current_user)
    await db.delete(dog)
