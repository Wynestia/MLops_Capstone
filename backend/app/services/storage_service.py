"""Storage service - local filesystem for MVP, S3 for production."""
import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile

from app.core.config import settings


class StorageService:
    def __init__(self):
        if settings.STORAGE_BACKEND == "local":
            Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    async def save_image(self, file: UploadFile, prefix: str = "analysis") -> str:
        """Save uploaded file and return its accessible URL/path."""
        ext = Path(file.filename).suffix if file.filename else ".jpg"
        filename = f"{prefix}_{uuid.uuid4().hex}{ext}"

        if settings.STORAGE_BACKEND == "s3":
            return await self._save_to_s3(file, filename)
        else:
            return await self._save_local(file, filename)

    async def _save_local(self, file: UploadFile, filename: str) -> str:
        file_path = Path(settings.UPLOAD_DIR) / filename
        content = await file.read()
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        return f"/uploads/{filename}"

    async def _save_to_s3(self, file: UploadFile, filename: str) -> str:
        import boto3
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        content = await file.read()
        s3.put_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=f"uploads/{filename}",
            Body=content,
            ContentType=file.content_type or "image/jpeg",
        )
        return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/uploads/{filename}"


storage_service = StorageService()
