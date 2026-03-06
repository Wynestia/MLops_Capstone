from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.dog import Dog
from app.models.health import MoodAnalysis, MoodLog
from app.schemas.health import MoodAnalysisOut
from app.services.ml_service import ml_service
from app.services.storage_service import storage_service
from app.core.config import settings

router = APIRouter(prefix="/dogs", tags=["Analyze"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


async def _get_dog_or_404(dog_id: str, user: User, db: AsyncSession) -> Dog:
    result = await db.execute(select(Dog).where(Dog.id == dog_id, Dog.user_id == user.id))
    dog = result.scalar_one_or_none()
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


@router.post("/{dog_id}/analyze", response_model=MoodAnalysisOut, status_code=201)
async def analyze_image(
    dog_id: str,
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dog = await _get_dog_or_404(dog_id, current_user, db)

    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {image.content_type}")

    # Save image
    image_url = await storage_service.save_image(image, prefix=f"dog_{dog_id}")

    # Reset file pointer for ML inference
    await image.seek(0)
    image_bytes = await image.read()

    # Run ML inference
    prediction = ml_service.predict(image_bytes)

    # Save analysis to DB
    analysis = MoodAnalysis(
        dog_id=dog_id,
        image_url=image_url,
        mood=prediction["mood"],
        confidence=prediction["confidence"],
        scores=prediction["scores"],
        model_version=settings.MODEL_VERSION,
    )
    db.add(analysis)

    # Auto-create mood log from analysis
    mood_log = MoodLog(
        dog_id=dog_id,
        mood=prediction["mood"],
        source="analysis",
        note=f"Auto-detected from image analysis (confidence: {prediction['confidence']:.1f}%)",
    )
    db.add(mood_log)

    await db.flush()
    await db.refresh(analysis)
    return MoodAnalysisOut.model_validate(analysis)


@router.get("/{dog_id}/analyses", response_model=list[MoodAnalysisOut])
async def list_analyses(
    dog_id: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(
        select(MoodAnalysis)
        .where(MoodAnalysis.dog_id == dog_id)
        .order_by(MoodAnalysis.analyzed_at.desc())
        .limit(limit)
    )
    return [MoodAnalysisOut.model_validate(a) for a in result.scalars().all()]


@router.get("/{dog_id}/analyses/{analysis_id}", response_model=MoodAnalysisOut)
async def get_analysis(
    dog_id: str,
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_dog_or_404(dog_id, current_user, db)
    result = await db.execute(
        select(MoodAnalysis).where(
            MoodAnalysis.id == analysis_id,
            MoodAnalysis.dog_id == dog_id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return MoodAnalysisOut.model_validate(analysis)
