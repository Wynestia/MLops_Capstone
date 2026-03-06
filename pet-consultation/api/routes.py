from fastapi import APIRouter, HTTPException
from schemas.request import ChatRequest, AnalyzeRequest, SummaryRequest
from schemas.response import (
    TextResponse, StructuredResponse, AnalysisResponse,
    SummaryResponse, HealthResponse,
)
from services.chat_service import chat_service
from client.groq_client import groq_client
from config.settings import GROQ_MODEL
from config.constants import ResponseMode

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """ตรวจสอบสถานะระบบและการเชื่อมต่อ Groq API"""
    groq_ok = await groq_client.health_check()
    return HealthResponse(
        status="ok" if groq_ok else "degraded",
        model=GROQ_MODEL,
    )


@router.post("/chat", tags=["Chat"])
async def chat(request: ChatRequest):
    """
    ส่งข้อความสนทนาและรับคำตอบจาก AI

    - รองรับ multi-turn conversation ผ่าน session_id
    - ตรวจจับ intent อัตโนมัติ
    - รองรับ response mode: text / structured
    """
    try:
        result = await chat_service.chat(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_emotion(request: AnalyzeRequest):
    """
    วิเคราะห์แนวโน้มอารมณ์แบบ batch

    - วิเคราะห์ emotion distribution, trend, anomalies
    - สรุปด้วย LLM
    """
    try:
        result = await chat_service.analyze(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summary", response_model=SummaryResponse, tags=["Analysis"])
async def weekly_summary(request: SummaryRequest):
    """
    สรุปสุขภาพจิตใจรายสัปดาห์หรือรายเดือน
    """
    try:
        result = await chat_service.summarize(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
