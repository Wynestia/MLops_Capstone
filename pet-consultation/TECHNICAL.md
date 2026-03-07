# 🐾 Pet Consultation LLM API — Technical Documentation

> AI-powered pet emotion consultation service รองรับภาษาไทย/อังกฤษ  
> Built with **FastAPI + Groq (OpenAI-compatible) + Pydantic**

---

## 📁 Project Structure

```
pet-consultation/
├── main.py                       # FastAPI app entry point
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables (API keys)
├── test_chat.py                  # API test suite
│
├── api/
│   └── routes.py                 # HTTP route definitions (endpoints)
│
├── client/
│   └── groq_client.py            # Groq API client (OpenAI-compatible)
│
├── config/
│   ├── settings.py               # App settings (API key, model, limits)
│   └── constants.py              # Enums, keyword lists, emotion labels
│
├── prompt/
│   ├── builder.py                # Prompt assembly + Few-Shot/CoT injection
│   └── templates.py              # All prompt templates (TH/EN)
│
├── schemas/
│   ├── request.py                # Request body models (Pydantic)
│   └── response.py               # Response body models (Pydantic)
│
├── services/
│   ├── chat_service.py           # Core business logic (chat/analyze/summarize)
│   ├── intent_detector.py        # Keyword-based intent classification
│   ├── safety_filter.py          # Alert level & medical disclaimer logic
│   ├── emotion_analyzer.py       # Batch emotion trend analysis
│   └── history_summarizer.py     # ✨ Rule-based emotion history summarizer
│
└── utils/
    ├── cache.py                  # In-memory TTL response cache
    ├── token_counter.py          # Token budget & history truncation
    └── language.py               # Language auto-detection
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
  detect_language()              ← ตรวจภาษาอัตโนมัติ
        │
        ▼
  detect_intent()                ← classify: health_concern / suggest / explain / trend / general
        │
        ▼
  INTENT_TEMPERATURE[intent]     ← ✨ เลือก temperature ตาม intent (0.2–0.75)
        │
        ▼
  truncate_history_by_token_budget()
        │
        ├─ (ถ้ามี records ที่ถูกตัดออก)
        ▼
  summarize_emotion_history()    ← ✨ สรุปประวัติเก่าแทนการทิ้ง
        │
        ▼
  build_system_prompt()          ← รวม persona + emotion + intent instruction
        │   + ✨ Few-Shot examples (health/suggest intents)
        │   + ✨ Chain-of-Thought steps (health/trend intents)
        ▼
  response_cache.get()           ← ตรวจ cache (TTL 5 min)
        │
        ▼ (cache miss)
  groq_client.chat(temperature)  ← ส่งไปยัง Groq API พร้อม intent-tuned temp
        │
        ▼
  determine_alert_level()        ← คำนวณ alert level
  should_add_disclaimer()        ← ตรวจ medical disclaimer
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
- `FEW_SHOT_HEALTH_TH/EN` — ✨ ตัวอย่าง Q&A สำหรับ health_concern
- `FEW_SHOT_SUGGEST_TH/EN` — ✨ ตัวอย่าง Q&A สำหรับ suggest_action
- `COT_HEALTH_TH/EN` — ✨ Chain-of-Thought steps สำหรับ health_concern
- `COT_TREND_TH/EN` — ✨ Chain-of-Thought steps สำหรับ trend_analysis
- `STRUCTURED_OUTPUT_INSTRUCTION_TH/EN` — สั่งให้ตอบเป็น JSON
- `MEDICAL_DISCLAIMER_TH/EN` — คำเตือนสุขภาพ
- `UNCERTAINTY_NOTE_TH/EN` — คำเตือนเมื่อ confidence ต่ำ

### Builder (`prompt/builder.py`)
`build_system_prompt()` รวม template ทุกส่วนตามลำดับ:
1. System base rules
2. Pet persona
3. Current emotion
4. Emotion history
5. Intent instruction
6. ✨ Few-Shot examples (health_concern / suggest_action)
7. ✨ Chain-of-Thought steps (health_concern / trend_analysis)
8. Structured output instruction (ถ้า mode = structured)

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

---

## ✨ LLM Performance Techniques

เทคนิคที่ implement เพื่อเพิ่ม response quality:

### 1. Intent-based Temperature Tuning
ปรับ `temperature` ตาม intent แทนค่าคงที่ 0.7

| Intent | Temperature | เหตุผล |
|---|---|---|
| `health_concern` | **0.2** | ต้องการความระมัดระวัง, conservative |
| `trend_analysis` | **0.3** | ต้องการความแม่นยำ, analytical |
| `explain_emotion` | **0.5** | balanced |
| `suggest_action` | **0.6** | helpful, slightly creative |
| `general_chat` | **0.75** | warm, conversational |

---

### 2. Few-Shot Prompting
เพิ่มตัวอย่าง Q&A ใน system prompt สำหรับ intent ที่ต้องการ tone/format เฉพาะ
- `health_concern` → ตัวอย่างการตอบที่ระมัดระวัง, แนะนำพบสัตวแพทย์
- `suggest_action` → ตัวอย่างคำแนะนำที่เป็นรูปแบบ numbered list

> ช่วยให้ LLM เข้าใจ expected output format และ tone โดยไม่ต้อง fine-tune

---

### 3. Chain-of-Thought (CoT) Reasoning
ใส่คำสั่งให้ LLM วิเคราะห์ step-by-step ก่อนตอบ สำหรับ intent ที่ซับซ้อน:
- `health_concern`: อาการ → ความเสี่ยง → สาเหตุ → คำแนะนำ
- `trend_analysis`: dominant → trend → anomalies → คำแนะนำ

> ลด hallucination และเพิ่ม reasoning quality สำหรับกรณีสำคัญ

---

### 4. History Summarization (แทน Hard Truncation)
เมื่อ emotion history เกิน token budget, ระบบจะ:
1. **ตัด** records ที่ใหม่กว่าออกไว้ใน context
2. **สรุป** records เก่าด้วย `history_summarizer.py` (rule-based, ไม่เรียก LLM เพิ่ม)
3. **แทรก** summary เป็น system message ต้น session

```
[สรุปประวัติ 15 ครั้ง] อารมณ์หลัก: sad (53%) | แนวโน้ม: แย่ลง | การกระจาย: sad (8/15), neutral (4/15), happy (3/15)
```

> ป้องกันการสูญเสีย context สำคัญ โดยไม่เพิ่ม latency จาก LLM call

---

## ⚠️ Limitations

- **No persistent storage** — session history และ cache หายเมื่อ restart
- **No authentication** — API ไม่มี API key หรือ auth ในตอนนี้
- **Intent detection** — ใช้ keyword matching เท่านั้น ไม่ใช้ ML-based NLU
- **Token estimation** — ใช้การประมาณ (~3 chars/token) ไม่ใช่ tokenizer จริง
- **History summarizer** — ใช้ rule-based logic, ไม่ใช่ LLM summarization
