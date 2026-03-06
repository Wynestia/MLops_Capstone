# 🐾 Pet Consultation LLM API — Technical Documentation

> AI-powered pet emotion consultation service รองรับภาษาไทย/อังกฤษ  
> Built with **FastAPI + Groq (OpenAI-compatible) + Pydantic**

---

## 📁 Project Structure

```
pet-consultation/
├── main.py                   # FastAPI app entry point
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (API keys)
├── test_chat.py              # API test suite
│
├── api/
│   └── routes.py             # HTTP route definitions (endpoints)
│
├── client/
│   └── groq_client.py        # Groq API client (OpenAI-compatible)
│
├── config/
│   ├── settings.py           # App settings (API key, model, limits)
│   └── constants.py          # Enums, keyword lists, emotion labels
│
├── prompt/
│   ├── builder.py            # Prompt assembly logic
│   └── templates.py          # Prompt string templates (TH/EN)
│
├── schemas/
│   ├── request.py            # Request body models (Pydantic)
│   └── response.py           # Response body models (Pydantic)
│
├── services/
│   ├── chat_service.py       # Core business logic (chat/analyze/summarize)
│   ├── intent_detector.py    # Keyword-based intent classification
│   ├── safety_filter.py      # Alert level & medical disclaimer logic
│   └── emotion_analyzer.py   # Batch emotion trend analysis
│
└── utils/
    ├── cache.py              # In-memory TTL response cache
    ├── token_counter.py      # Token budget & history truncation
    └── language.py           # Language auto-detection
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | FastAPI 0.110+ |
| ASGI Server | Uvicorn with auto-reload |
| LLM Provider | Groq API (OpenAI-compatible endpoint) |
| LLM Client | `openai` Python SDK (pointed at Groq base URL) |
| Data Validation | Pydantic v2 + pydantic-settings |
| Environment Config | python-dotenv |
| HTTP Client | httpx (async) |
| Language Detection | langdetect |
| Caching | In-memory dict with TTL (no Redis needed) |

---

## ⚙️ Configuration (`config/settings.py`)

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | `.env` | Groq API key |
| `GROQ_MODEL` | `llama3-70b-8192` | LLM model name |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | API base URL |
| `MAX_TOKENS_RESPONSE` | `1024` | Max tokens per LLM response |
| `MAX_CONTEXT_TOKENS` | `6000` | Token budget for full context window |
| `MAX_HISTORY_TURNS` | `10` | Max conversation turns stored per session |
| `MAX_RETRIES` | `3` | LLM call retry count |
| `RETRY_DELAY` | `1.5s` | Base delay between retries (exponential) |
| `CACHE_TTL` | `300s` | Response cache expiry time |
| `CONFIDENCE_THRESHOLD` | `0.60` | Minimum confidence for reliable emotion |

---

## 🌐 API Endpoints

Base path: `http://localhost:8000/api/v1`

### `GET /health`
ตรวจสอบสถานะ server และ Groq API  
**Response:** `{ status, model, version }`

---

### `POST /chat`
สนทนากับ AI เกี่ยวกับสัตว์เลี้ยง รองรับ multi-turn conversation

**Request Body:**
```json
{
  "session_id": "string",
  "pet_profile": {
    "pet_id": "string",
    "name": "string",
    "species": "dog",
    "breed": "Golden Retriever",
    "age_years": 3.5,
    "gender": "male",
    "weight_kg": 28.0,
    "special_notes": "กลัวเสียงฟ้าร้อง"
  },
  "user_message": "string",
  "emotion_history": [
    {
      "timestamp": "2025-01-01T10:00:00",
      "emotion_label": "sad",
      "confidence": 0.85,
      "source": "image"
    }
  ],
  "language": "th",
  "response_mode": "text"
}
```

**Response Modes:**
- `text` → `{ session_id, message, alert_level, has_medical_disclaimer }`
- `structured` → `{ session_id, summary, emotion_label, confidence, recommendations[], alert_level }`

---

### `POST /analyze`
วิเคราะห์แนวโน้มอารมณ์แบบ batch (7 วัน หรือกำหนดเอง)

**Response:** `{ dominant_emotion, emotion_distribution, trend, anomalies[], summary, alert_level }`

**Trend values:** `improving` | `declining` | `stable` | `fluctuating`

---

### `POST /summary`
สรุปสุขภาพจิตใจรายสัปดาห์/รายเดือน

**Response:** `{ summary, highlights[], alert_level }`

---

## 🧠 Core Logic Flow

```
User Request (POST /chat)
        │
        ▼
  detect_language()         ← ตรวจภาษาอัตโนมัติ
        │
        ▼
  detect_intent()           ← classify: health_concern / suggest / explain / trend / general
        │
        ▼
  truncate_history_by_token_budget()  ← ตัด emotion history ให้อยู่ใน 6000 token budget
        │
        ▼
  build_system_prompt()     ← สร้าง system prompt จาก pet profile + emotion + intent + language
        │
        ▼
  response_cache.get()      ← ตรวจ cache (TTL 5 min)
        │
        ▼ (cache miss)
  groq_client.chat()        ← ส่งไปยัง Groq API พร้อม retry logic
        │
        ▼
  determine_alert_level()   ← คำนวณ alert level จาก emotion + intent
  should_add_disclaimer()   ← ตรวจว่าต้องแนบ medical disclaimer
        │
        ▼
  Parse → TextResponse | StructuredResponse
```

---

## 🎯 Intent Detection (`services/intent_detector.py`)

ตรวจ intent ด้วย keyword matching (ไม่ใช้ ML) — เรียงตาม priority:

| Priority | Intent | ตัวอย่าง Keywords (TH) |
|---|---|---|
| 1 (สูงสุด) | `health_concern` | เจ็บ, ป่วย, อาเจียน, ชัก, เลือด |
| 2 | `trend_analysis` | แนวโน้ม, สัปดาห์, ประวัติ |
| 3 | `suggest_action` | ควรทำ, แนะนำ, วิธี, ช่วย |
| 4 | `explain_emotion` | ทำไม, อธิบาย, รู้สึก |
| 5 (ต่ำสุด) | `general_chat` | (default) |

---

## 🚨 Safety & Alert System (`services/safety_filter.py`)

### Alert Levels
| Level | เงื่อนไข |
|---|---|
| `HIGH` | intent = `health_concern` |
| `MEDIUM` | emotion ∈ {anxious, fearful} และ confidence > 70% |
| `LOW` | emotion ∈ {sad, angry} และ confidence > 80% |
| `NONE` | กรณีอื่น ๆ |

### Medical Disclaimer
ระบบจะแนบคำเตือนโดยอัตโนมัติเมื่อ:
- Intent เป็น `health_concern`
- หรือ message มี health keyword

---

## 💾 Session Management

- เก็บ conversation history ใน **in-memory dict** (`_session_store`)
- Key = `session_id` (string จาก frontend)
- จำกัด 10 turns (20 messages) ต่อ session
- Session จะหายเมื่อ restart server (ไม่มี persistent storage)

---

## ⚡ Caching (`utils/cache.py`)

- **In-memory TTL cache** (default 5 นาที)
- Cache key = MD5 hash ของ `{pet_id, message, intent, response_mode}`
- ไม่ cache สำหรับ `analyze` และ `summary` endpoints (batch operations)

---

## 📊 Emotion Analyzer (`services/emotion_analyzer.py`)

ฟังก์ชันสำหรับ `/analyze` endpoint:

| Function | Description |
|---|---|
| `compute_emotion_distribution()` | คำนวณ % ของแต่ละ emotion |
| `find_dominant_emotion()` | หา emotion ที่พบบ่อยที่สุด |
| `detect_trend()` | วิเคราะห์ทิศทาง: improving/declining/stable/fluctuating |
| `detect_anomalies()` | หา emotion ที่ผิดปกติ (outlier) |
| `get_alert_from_analysis()` | กำหนด alert level จาก result |

---

## 📝 Prompt System (`prompt/`)

### Templates (`prompt/templates.py`)
รองรับ TH/EN ทุก template:
- `SYSTEM_BASE_TH/EN` — กฎพื้นฐานของ AI assistant
- `PERSONA_TEMPLATE_TH/EN` — แสดงข้อมูลสัตว์เลี้ยง
- `CURRENT_EMOTION_TH/EN` — แสดงอารมณ์ปัจจุบัน + uncertainty note
- `EMOTION_HISTORY_TH/EN` — แสดงประวัติอารมณ์
- `INTENT_*_TH/EN` — คำสั่งเพิ่มตาม intent
- `STRUCTURED_OUTPUT_INSTRUCTION_TH/EN` — สั่งให้ตอบเป็น JSON
- `MEDICAL_DISCLAIMER_TH/EN` — คำเตือนสุขภาพ
- `UNCERTAINTY_NOTE_TH/EN` — คำเตือนเมื่อ confidence ต่ำ

### Builder (`prompt/builder.py`)
`build_system_prompt()` รวม template ทุกส่วนเป็น system prompt เดียว

---

## 🔑 Environment Variables (`.env`)

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192
```

---

## 🧪 Running Tests

ต้อง start server ก่อน:
```bash
python main.py
```

รัน test suite:
```bash
python test_chat.py
```

หรือดู API docs ที่ [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

---

## 📦 Installation

```bash
pip install -r requirements.txt
```

**Dependencies:**
- `fastapi>=0.110.0`
- `uvicorn[standard]>=0.29.0`
- `openai>=1.30.0` ← ใช้เป็น OpenAI-compatible client กับ Groq
- `pydantic>=2.7.0`
- `pydantic-settings>=2.0.0`
- `python-dotenv>=1.0.0`
- `httpx>=0.27.0`

---

## ⚠️ Limitations

- **No persistent storage** — session history และ cache หายเมื่อ restart
- **No authentication** — API ไม่มี API key หรือ auth ในตอนนี้
- **Intent detection** — ใช้ keyword matching เท่านั้น ไม่ใช้ ML-based NLU
- **Token estimation** — ใช้การประมาณ (~3 chars/token) ไม่ใช่ tokenizer จริง
