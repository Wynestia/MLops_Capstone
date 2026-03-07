"""
test_chat.py - ทดสอบ Pet Consultation Chat API
รัน: python test_chat.py

ข้อกำหนด: server ต้องรันอยู่ก่อน (python main.py)
"""

import httpx
import asyncio
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"


# ========== Helper ==========

def make_emotion_history(emotions: list[tuple[str, float]]) -> list[dict]:
    """สร้าง emotion_history จาก list ของ (label, confidence)"""
    records = []
    for i, (label, conf) in enumerate(emotions):
        records.append({
            "timestamp": (datetime.now() - timedelta(hours=i)).isoformat(),
            "emotion_label": label,
            "confidence": conf,
            "source": "image",
        })
    return records


PET_PROFILE = {
    "pet_id": "dog-001",
    "name": "มะม่วง",
    "species": "dog",
    "breed": "Golden Retriever",
    "age_years": 3.5,
    "gender": "male",
    "weight_kg": 28.0,
    "special_notes": "กลัวเสียงฟ้าร้อง",
}


# ========== Tests ==========

async def test_health():
    """ทดสอบ health endpoint"""
    print("\n🔍 [1] Health Check")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(f"{BASE_URL}/health")
        print(f"   Status: {res.status_code}")
        print(f"   Body:   {res.json()}")
        assert res.status_code == 200, "Health check failed!"
    print("   ✅ PASSED")


async def test_chat_general():
    """ทดสอบ chat ทั่วไปเกี่ยวกับพฤติกรรมน้องหมา"""
    print("\n💬 [2] Chat - General Question (TH)")
    payload = {
        "session_id": "session-test-001",
        "pet_profile": PET_PROFILE,
        "user_message": "น้องหมาของฉันดูเศร้ามากวันนี้ ควรทำอะไรดี?",
        "emotion_history": make_emotion_history([("sad", 0.82), ("sad", 0.75), ("neutral", 0.60)]),
        "language": "th",
        "response_mode": "text",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{BASE_URL}/chat", json=payload)
        data = res.json()
        print(f"   Status: {res.status_code}")
        print(f"   Reply:  {str(data)[:300]}...")
        assert res.status_code == 200, f"Chat failed: {data}"
    print("   ✅ PASSED")


async def test_chat_health_concern():
    """ทดสอบ chat เมื่อมีอาการสุขภาพ"""
    print("\n🏥 [3] Chat - Health Concern")
    payload = {
        "session_id": "session-test-002",
        "pet_profile": PET_PROFILE,
        "user_message": "น้องหมาอาเจียนและไม่ยอมกินข้าวมา 2 วันแล้ว",
        "emotion_history": make_emotion_history([("sad", 0.90), ("anxious", 0.85)]),
        "language": "th",
        "response_mode": "text",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{BASE_URL}/chat", json=payload)
        data = res.json()
        print(f"   Status: {res.status_code}")
        print(f"   Reply:  {str(data)[:300]}...")
        assert res.status_code == 200, f"Chat failed: {data}"
    print("   ✅ PASSED")


async def test_chat_happy():
    """ทดสอบ chat เมื่อน้องหมามีความสุข"""
    print("\n😄 [4] Chat - Happy Emotion")
    payload = {
        "session_id": "session-test-003",
        "pet_profile": PET_PROFILE,
        "user_message": "วันนี้น้องหมาดูสนุกมากเลย อยากรู้ว่าควรเล่นอะไรกับเขาดี?",
        "emotion_history": make_emotion_history([("happy", 0.95), ("playful", 0.88), ("excited", 0.80)]),
        "language": "th",
        "response_mode": "text",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{BASE_URL}/chat", json=payload)
        data = res.json()
        print(f"   Status: {res.status_code}")
        print(f"   Reply:  {str(data)[:300]}...")
        assert res.status_code == 200, f"Chat failed: {data}"
    print("   ✅ PASSED")


async def test_chat_structured():
    """ทดสอบ chat ในโหมด structured response"""
    print("\n📊 [5] Chat - Structured Response Mode")
    payload = {
        "session_id": "session-test-004",
        "pet_profile": PET_PROFILE,
        "user_message": "ช่วยวิเคราะห์อารมณ์ของน้องหมาในช่วงนี้หน่อย",
        "emotion_history": make_emotion_history([
            ("angry", 0.70), ("anxious", 0.65), ("sad", 0.80), ("neutral", 0.55)
        ]),
        "language": "th",
        "response_mode": "structured",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{BASE_URL}/chat", json=payload)
        data = res.json()
        print(f"   Status: {res.status_code}")
        print(f"   Reply:  {str(data)[:400]}...")
        assert res.status_code == 200, f"Chat failed: {data}"
    print("   ✅ PASSED")


async def test_analyze():
    """ทดสอบ emotion analyze endpoint"""
    print("\n📈 [6] Analyze Emotion Trend")
    payload = {
        "pet_profile": PET_PROFILE,
        "emotion_history": make_emotion_history([
            ("sad", 0.80), ("sad", 0.75), ("anxious", 0.70),
            ("neutral", 0.55), ("happy", 0.60), ("sad", 0.85),
            ("angry", 0.65),
        ]),
        "timeframe_days": 7,
        "language": "th",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{BASE_URL}/analyze", json=payload)
        data = res.json()
        print(f"   Status: {res.status_code}")
        print(f"   Reply:  {str(data)[:400]}...")
        assert res.status_code == 200, f"Analyze failed: {data}"
    print("   ✅ PASSED")


async def test_summary():
    """ทดสอบ weekly summary endpoint"""
    print("\n📝 [7] Weekly Summary")
    payload = {
        "pet_profile": PET_PROFILE,
        "emotion_history": make_emotion_history([
            ("happy", 0.90), ("happy", 0.85), ("neutral", 0.60),
            ("sad", 0.75), ("playful", 0.88), ("excited", 0.92),
            ("neutral", 0.55),
        ]),
        "period": "weekly",
        "language": "th",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{BASE_URL}/summary", json=payload)
        data = res.json()
        print(f"   Status: {res.status_code}")
        print(f"   Reply:  {str(data)[:400]}...")
        assert res.status_code == 200, f"Summary failed: {data}"
    print("   ✅ PASSED")


# ========== Main ==========

async def main():
    print("=" * 50)
    print("🐾 Pet Consultation API Test Suite")
    print("=" * 50)

    tests = [
        test_health,
        test_chat_general,
        test_chat_health_concern,
        test_chat_happy,
        test_chat_structured,
        test_analyze,
        test_summary,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            await test()
            passed += 1
        except Exception as e:
            print(f"   ❌ FAILED: {e}")
            failed += 1

    print("\n" + "=" * 50)
    print(f"✅ Passed: {passed} | ❌ Failed: {failed} | Total: {len(tests)}")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
