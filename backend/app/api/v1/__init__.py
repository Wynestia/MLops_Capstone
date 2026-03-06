from fastapi import APIRouter

from app.api.v1 import auth, dogs, analyze, moods, health, chat, reports

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(dogs.router)
api_router.include_router(analyze.router)
api_router.include_router(moods.router)
api_router.include_router(health.router)
api_router.include_router(chat.router)
api_router.include_router(reports.router)
