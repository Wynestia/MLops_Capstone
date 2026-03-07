# 🐾 Pet Consultation LLM Module

ระบบ AI ให้คำปรึกษาสัตว์เลี้ยง — วิเคราะห์อารมณ์และพฤติกรรมด้วย Groq LLM

---

## 📁 โครงสร้างโฟลเดอร์

```
model/
├── config/
│   ├── settings.py       # Groq API key, model, token limits
│   └── constants.py      # Enums: AlertLevel, Intent, Language, keywords
├── prompt/
│   ├── templates.py      # Prompt strings แยกตาม intent + ภาษา
│   ├── builder.py        # Dynamic prompt construction
│   └── persona.py        # Pet persona generator
├── client/
│   └── groq_client.py    # Groq API wrapper + retry logic
├── services/
│   ├── chat_service.py   # Main orchestration (chat / analyze / summary)
│   ├── emotion_analyzer.py  # Trend, distribution, anomaly detection
│   ├── intent_detector.py   # Keyword-based intent classification
│   └── safety_filter.py     # Medical disclaimer + alert level
├── schemas/
│   ├── request.py        # Pydantic input models
│   └── response.py       # Pydantic output models
├── api/
│   └── routes.py         # FastAPI route definitions
├── utils/
│   ├── cache.py          # In-memory response caching (TTL-based)
│   ├── token_counter.py  # Token budget + history truncation
│   └── language.py       # Thai/English auto-detection
├── main.py               # FastAPI app entry point
├── requirements.txt
└── .env.example
```

---

## 🚀 การติดตั้งและรัน

```bash
# 1. Clone / copy โฟลเดอร์
cd model

# 2. ติดตั้ง dependencies
pip install -r requirements.txt

# 3. ตั้งค่า API key
cp .env.example .env
# แก้ไข GROQ_API_KEY ใน .env

# 4. รัน server
python main.py
# หรือ
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API จะพร้อมใช้งานที่ `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

---

## 📡 API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| `GET` | `/api/v1/health` | ตรวจสอบสถานะระบบ |
| `POST` | `/api/v1/chat` | ส่งข้อความสนทนา (main) |
| `POST` | `/api/v1/analyze` | วิเคราะห์ emotion history แบบ batch |
| `POST` | `/api/v1/summary` | สรุปรายสัปดาห์/รายเดือน |

---

## 💬 ตัวอย่าง Request

### POST /api/v1/chat

```json
{
  "session_id": "user-123-session-1",
  "pet_profile": {
    "pet_id": "pet-001",
    "name": "แม็กซ์",
    "species": "dog",
    "breed": "Golden Retriever",
    "age_years": 3,
    "gender": "male",
    "weight_kg": 28.5,
    "special_notes": "กลัวเสียงดัง ชอบวิ่งเล่น"
  },
  "user_message": "วันนี้แม็กซ์ดูเศร้า ควรทำยังไงดี?",
  "emotion_history": [
    {
      "timestamp": "2024-01-15T10:00:00",
      "emotion_label": "sad",
      "confidence": 0.82
    }
  ],
  "language": "th",
  "response_mode": "text"
}
```

### Response (text mode)

```json
{
  "session_id": "user-123-session-1",
  "message": "แม็กซ์ดูเหมือนจะรู้สึกเศร้าในวันนี้ค่ะ...",
  "alert_level": "low",
  "has_medical_disclaimer": false
}
```

---

## ⚙️ Features

| Feature | Status |
|---------|--------|
| Multi-turn conversation memory | ✅ |
| Intent detection (5 intents) | ✅ |
| Dynamic prompt per intent | ✅ |
| Pet persona contextualization | ✅ |
| Medical disclaimer injection | ✅ |
| Alert level system (none/low/medium/high) | ✅ |
| Emotion trend analysis | ✅ |
| Anomaly detection | ✅ |
| Structured JSON output mode | ✅ |
| Thai/English auto-detection | ✅ |
| Response caching (TTL) | ✅ |
| Token budget management | ✅ |
| Groq API retry logic (3x) | ✅ |
| Fallback message | ✅ |

---

## 🔧 Configuration

ตั้งค่าใน `config/settings.py` หรือผ่าน environment variables:

| Variable | Default | คำอธิบาย |
|----------|---------|---------|
| `GROQ_API_KEY` | - | Groq API key (required) |
| `GROQ_MODEL` | `llama3-70b-8192` | Model ที่ใช้ |
| `MAX_TOKENS_RESPONSE` | `1024` | Token สูงสุดต่อ response |
| `MAX_CONTEXT_TOKENS` | `6000` | Token budget ของ context |
| `MAX_HISTORY_TURNS` | `10` | จำนวน turns ที่จำใน session |
| `CACHE_TTL` | `300` | Cache TTL (วินาที) |
| `CONFIDENCE_THRESHOLD` | `0.60` | Threshold สำหรับ uncertainty warning |
