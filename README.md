# PawMind
## หมายเหตุข้อมูลการใช้งาน ในโค๊ด docker compose ถูกออกแบบมาเพื่อรัน on cloud เท่านั้น!

## MLFLOW
- สามารถเข้าใช้งานได้ที่ http://34.143.232.141:5000/?fbclid=IwY2xjawQdcr1leHRuA2FlbQIxMABicmlkETFHalJHcDBkT2RFNTdTMHR1c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHt1m57zu9G2rFoJkOahzrlmVEG4VpDuLBcDU8JXQrDd3_uaQEeMTToHOCc5A_aem_sm5UFsammdIvceXcTciGgQ#/
## FRONTEND
- สามารถเข้าใช้งานได้ทัี่ http://34.124.191.174

## PGADMIN
- สามารถเข้าถึงได้ที่ http://127.0.0.1:5050/browser/ โดยหากจะเปิดจำเป็นที่จะต้อง gen key เเล้วเอา public key ไปใส่ใน setting -> ssh -> add key เเล้วใส่ public เข้าไป เเล้วใช้คำสั่ง  ssh -i /Users/aomtamon/Documents/mykey/g66070085_gcp_key -N -L 5051:127.0.0.1:5050 g66070085@34.124.191.174

## การเข้าดูไฟลทีที่ใช้ในการทำงาน
- ต้องพิมพ์คำสั่งนี้ sudo su - g66070085 ใน ssh terminal ของ google cloud ถึงจะเห็นไฟล์เเละโฟลเดอร์การทำงานทั้งหมด

## สมาชิกกลุ่ม
ธมนพรรณ ปุณโณฑก หน้าที่า google cloud
สรัญญา แก้วพิภพ หน้าที่ backend
ธนพล อาภาวุฒิคุณ หน้าที่ frontend
อัษฎาวุธ ธรรมวณิช หน้าที่ Model & MLFlow

## ข้อมูลเว็บไซต์คร่าวๆ
PawMind คือระบบเว็บแอปพลิเคชันสำหรับติดตามสุขภาพและวิเคราะห์อารมณ์ของสุนัข โดยผสานการจัดเก็บข้อมูลสุขภาพเข้ากับการใช้ AI/ML เพื่อช่วยให้เจ้าของสามารถเฝ้าติดตามพฤติกรรมและสภาวะของสุนัขได้อย่างเป็นระบบ รวมถึงใช้ข้อมูลเหล่านี้ประกอบการดูแลและการปรึกษาสัตวแพทย์ได้อย่างมีประสิทธิภาพ

## ที่มาและความสำคัญของโครงงาน

ในชีวิตประจำวัน เจ้าของสุนัขมักสังเกตอารมณ์และสุขภาพของสุนัขจากพฤติกรรมภายนอก เช่น สีหน้า การกิน การเล่น หรือความผิดปกติทางอารมณ์ แต่ข้อมูลเหล่านี้มักไม่ได้ถูกบันทึกไว้อย่างเป็นระบบ ทำให้ยากต่อการติดตามแนวโน้มในระยะยาว

โครงงานนี้จึงถูกพัฒนาขึ้นเพื่อรวมข้อมูลสำคัญของสุนัขไว้ในระบบเดียว ทั้งข้อมูลสุขภาพ ประวัติการดูแล และผลการวิเคราะห์อารมณ์จากรูปภาพ เพื่อให้เจ้าของสามารถเข้าถึงข้อมูลได้สะดวก และใช้เทคโนโลยี AI เข้ามาช่วยเพิ่มความแม่นยำในการประเมินเบื้องต้น

## วัตถุประสงค์

- พัฒนาระบบเว็บสำหรับจัดเก็บและติดตามข้อมูลสุขภาพของสุนัข
- พัฒนาโมดูลวิเคราะห์อารมณ์สุนัขจากรูปภาพด้วย Machine Learning
- สร้าง dashboard และรายงานเพื่อช่วยให้ผู้ใช้เห็นแนวโน้มของข้อมูล
- เพิ่มฟีเจอร์ AI chat เพื่อช่วยตอบคำถามหรือให้คำแนะนำเบื้องต้นเกี่ยวกับการดูแลสุนัข
- ออกแบบระบบให้สามารถ deploy และใช้งานจริงได้บน cloud

## ขอบเขตของระบบ

ระบบ PawMind รองรับความสามารถหลักดังนี้

- สมัครสมาชิกและเข้าสู่ระบบ
- จัดการข้อมูลสุนัขแต่ละตัว
- วิเคราะห์อารมณ์สุนัขจากภาพถ่าย
- บันทึกประวัติอารมณ์ น้ำหนัก สุขภาพ วัคซีน ยา และกิจกรรม
- บันทึก journal สำหรับติดตามพฤติกรรมหรือเหตุการณ์สำคัญ
- แสดง dashboard และรายงานรายเดือน
- ใช้งานระบบแชตเพื่อสอบถามข้อมูลหรือขอคำแนะนำเกี่ยวกับสัตว์เลี้ยง

## ผู้ใช้งานหลักของระบบ

- เจ้าของสุนัข ที่ต้องการติดตามสุขภาพและอารมณ์ของสัตว์เลี้ยงอย่างเป็นระบบ
- ผู้พัฒนาและผู้ดูแลระบบ ที่ต้องการระบบตัวอย่างด้าน Full-Stack + AI/ML + Deployment
- ผู้สอนหรือผู้ประเมินโครงงาน ที่ต้องการเห็นการบูรณาการงาน Web, API, Database และ Machine Learning ภายในระบบเดียว

## หลักการทำงานของระบบ

ภาพรวมการทำงานของ PawMind สามารถอธิบายได้ดังนี้

1. ผู้ใช้เข้าสู่ระบบผ่านหน้าเว็บ
2. ผู้ใช้เพิ่มข้อมูลสุนัข เช่น ชื่อ สายพันธุ์ อายุ น้ำหนัก และข้อมูลพื้นฐาน
3. เมื่อผู้ใช้อัปโหลดรูปภาพ ระบบ backend จะ preprocess ภาพและส่งเข้าโมเดล AI
4. โมเดลจะทำนายอารมณ์ของสุนัข และบันทึกผลลงฐานข้อมูล
5. ข้อมูลสุขภาพและผลวิเคราะห์ที่บันทึกไว้จะถูกนำมาแสดงในหน้า dashboard และรายงาน
6. ผู้ใช้สามารถดูประวัติย้อนหลัง ติดตามแนวโน้ม และใช้ฟีเจอร์ AI chat เพื่อขอคำแนะนำเพิ่มเติมได้

## ฟีเจอร์เด่นของระบบ

### 1. ระบบจัดการข้อมูลสุนัข

ผู้ใช้สามารถเพิ่ม แก้ไข และลบข้อมูลสุนัขแต่ละตัวได้ พร้อมเก็บข้อมูลสำคัญที่เกี่ยวข้องกับการดูแล

### 2. ระบบวิเคราะห์อารมณ์จากภาพ

ระบบสามารถรับภาพสุนัขและวิเคราะห์อารมณ์โดยใช้โมเดล Machine Learning ที่รันผ่าน ONNX Runtime ในฝั่ง backend

### 3. ระบบติดตามสุขภาพ

รองรับการบันทึกข้อมูลหลากหลายประเภท เช่น

- น้ำหนัก
- บันทึกสุขภาพ
- วัคซีน
- ยา
- กิจกรรม
- journal

### 4. Dashboard และรายงาน

ระบบสามารถสรุปผลข้อมูลในรูปแบบ dashboard และรายงานรายเดือน เพื่อช่วยให้เห็นภาพรวมของสุขภาพและอารมณ์ของสุนัขแต่ละตัว

### 5. AI Chat / Pet Consultation

มีฟีเจอร์แชตสำหรับช่วยตอบคำถามและให้คำแนะนำเบื้องต้นเกี่ยวกับการดูแลสุนัข โดยเชื่อมต่อกับ AI service

## Tech Stack

### Frontend

- `React` ใช้พัฒนา UI ของระบบ
- `Vite` ใช้สำหรับรันและ build frontend
- `Recharts` ใช้แสดงกราฟและ dashboard
- `React Markdown` ใช้แสดงผลข้อความในรูปแบบ Markdown

### Backend

- `Python 3.12` เป็นภาษาหลักของ backend
- `FastAPI` ใช้สร้าง REST API
- `Uvicorn` ใช้รัน backend server
- `Pydantic` ใช้ตรวจสอบและกำหนดรูปแบบข้อมูล
- `SQLAlchemy` ใช้เชื่อมต่อและจัดการข้อมูลกับฐานข้อมูล
- `Alembic` ใช้จัดการ database migration
- `python-jose` ใช้สำหรับ JWT authentication
- `passlib` และ `bcrypt` ใช้เข้ารหัสรหัสผ่าน

### Database

- `PostgreSQL` ใช้เก็บข้อมูลหลักของระบบ
- `asyncpg` ใช้เชื่อมต่อ PostgreSQL แบบ asynchronous
- `psycopg2-binary` ใช้สำหรับงานเชื่อมต่อบางส่วนแบบ synchronous
- `pgAdmin` ใช้ช่วยจัดการฐานข้อมูลผ่านเว็บ

### AI / ML

- `ONNX` ใช้เป็นรูปแบบไฟล์โมเดลสำหรับนำไปใช้งานจริง
- `ONNX Runtime` ใช้รันโมเดลทำนายอารมณ์ในฝั่ง backend
- `NumPy` ใช้จัดการข้อมูลเชิงตัวเลข
- `Pillow` และ `OpenCV` ใช้ preprocess ภาพ
- `Groq API` ใช้รองรับฟีเจอร์ AI chat

### Infrastructure / Deployment

- `Docker` ใช้แยก service ของระบบออกเป็น container
- `Docker Compose` ใช้จัดการหลาย service พร้อมกัน
- `Nginx` ใช้เสิร์ฟ frontend ใน production
- `Google Cloud Platform (GCP)` ใช้สำหรับ deploy ระบบบน cloud

## สถาปัตยกรรมของระบบ

ระบบแบ่งออกเป็น 5 ชั้นหลัก

1. Frontend Layer
   ส่วนติดต่อผู้ใช้ที่พัฒนาด้วย React

2. Backend Layer
   FastAPI ทำหน้าที่รับ request จาก frontend ประมวลผล logic และเชื่อมต่อฐานข้อมูล

3. Database Layer
   PostgreSQL ทำหน้าที่เก็บข้อมูลผู้ใช้ สุนัข ประวัติสุขภาพ ผลวิเคราะห์ และข้อมูลแชต

4. AI/ML Layer
   โมเดล ONNX ใช้สำหรับวิเคราะห์อารมณ์จากรูปภาพสุนัข

5. Deployment Layer
   ใช้ Docker, Docker Compose และ Nginx เพื่อจัดการการ deploy และการให้บริการระบบ

## โครงสร้างของโปรเจกต์

```text
MLops_Capstone/
├── src/                        # Frontend React
├── backend/
│   ├── app/
│   │   ├── api/v1/             # Route ของ FastAPI
│   │   ├── core/               # config, database, security
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # service ต่าง ๆ เช่น ML และ chat
│   ├── ml/                     # model, checkpoint และ notebook ที่เกี่ยวกับ ML
│   ├── migrations/             # Alembic migration
│   ├── scripts/                # utility script
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.local.yml
│   └── docker-compose.prod.yml
├── nginx/                      # config ของ Nginx
├── Dockerfile.frontend
├── DEPLOYMENT_GUIDE.md
└── README.md
```

## หน้าหลักของระบบ

- `Login / Register`
- `Dashboard`
- `My Dogs`
- `Analyze Chat`
- `Reports`

## โครงสร้าง API หลัก

Backend route ถูกแบ่งเป็นหมวดดังนี้

- `auth` สำหรับระบบสมาชิกและการยืนยันตัวตน
- `dogs` สำหรับจัดการข้อมูลสุนัข
- `analyze` สำหรับวิเคราะห์อารมณ์จากภาพ
- `moods` สำหรับบันทึกอารมณ์และดูสรุปอารมณ์
- `health` สำหรับข้อมูลสุขภาพ น้ำหนัก ยา วัคซีน กิจกรรม และ journal
- `reports` สำหรับ dashboard และรายงาน
- `chat` สำหรับ AI chat และประวัติการสนทนา

## การเตรียมระบบก่อนใช้งาน

สิ่งที่ควรติดตั้งก่อน

- Node.js 20+
- npm
- Python 3.12
- PostgreSQL 16 หรือ Docker
- Git

## Environment Variables

ค่าตัวแปรสำหรับ backend อยู่ในไฟล์ `backend/.env.example`

ค่าที่สำคัญ เช่น

- `DATABASE_URL`
- `DATABASE_URL_SYNC`
- `MODEL_PATH`
- `GROQ_API_KEY`
- `CORS_ORIGINS`
- `UPLOAD_DIR`

การสร้างไฟล์ `.env`

```bash
cd backend
cp .env.example .env
```

## วิธีรันระบบแบบ Local

### Frontend

```bash
npm install
npm run dev
```

Frontend จะทำงานที่

```text
http://127.0.0.1:5173
```

### Backend

#### วิธีที่ 1: รัน backend จากเครื่องโดยตรง

เหมาะกับกรณีที่ Docker build backend image ไม่ผ่าน

เปิดฐานข้อมูลด้วย Docker

```bash
cd backend
docker compose -f docker-compose.local.yml up -d db
```

สร้าง virtual environment และติดตั้ง dependencies

```bash
cd backend
python3.12 -m venv .venv312
. .venv312/bin/activate
pip install -r requirements.txt
```

รัน backend

```bash
./scripts/run_local_api.sh
```

Backend จะทำงานที่

```text
http://127.0.0.1:8000
```

FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

#### วิธีที่ 2: รันด้วย Docker ทั้งชุด

```bash
cd backend
cp .env.example .env
docker compose up --build
```

## การ Deploy แบบ Production

ระบบ production ใช้ไฟล์หลักดังนี้

- `backend/docker-compose.prod.yml`
- `backend/Dockerfile`
- `Dockerfile.frontend`
- `nginx/frontend.conf`

สำหรับขั้นตอน deploy แบบละเอียดดูได้ที่

- `DEPLOYMENT_GUIDE.md`

## ข้อมูลเกี่ยวกับโมเดล AI

### ไฟล์โมเดลที่ backend ใช้งาน

Backend คาดว่าไฟล์โมเดล ONNX จะอยู่ที่

```text
backend/ml/model.onnx
```

ส่วนไฟล์ต้นทางแบบ PyTorch ที่ใช้แปลงคือ

```text
backend/ml/model.pth
```

และ notebook สำหรับ training อยู่ที่

```text
backend/ml/notebooks/dog-emotions-classifier.ipynb
```

### ลำดับ label ปัจจุบันของโมเดล

ระบบ map output ของโมเดลเป็น

```text
0 = Angry
1 = Happy
2 = Relaxed
3 = Sad
```

### หมายเหตุ

ไฟล์ `backend/ml/model.onnx` ถูก ignore จาก Git
ดังนั้นหาก deploy บน server ต้องตรวจสอบว่าไฟล์นี้ถูกนำขึ้นไปด้วยจริง มิฉะนั้นระบบจะ fallback ไปใช้ mock inference

## ผลลัพธ์ที่คาดหวังจากโครงงาน

- ผู้ใช้สามารถติดตามสุขภาพและอารมณ์ของสุนัขได้ในระบบเดียว
- ผู้ใช้เห็นแนวโน้มของข้อมูลได้จาก dashboard และรายงาน
- ระบบสามารถใช้ AI ช่วยประเมินอารมณ์จากรูปภาพได้
- ระบบมีโครงสร้างที่พร้อมต่อยอดทั้งด้าน software engineering และ MLOps

## ปัญหาที่อาจพบระหว่างใช้งาน

### Backend ให้ผลวิเคราะห์เป็น mock

ให้ตรวจสอบว่า

- มีไฟล์ `backend/ml/model.onnx`
- ค่า `MODEL_PATH` ถูกต้อง
- log ของ backend แสดงว่าโหลดโมเดลสำเร็จ

### Docker build backend ไม่ผ่านและขึ้น `exec format error`

มักเกิดจากปัญหา platform ของ Docker ในเครื่องไม่ตรงกัน
ในกรณีนี้ให้ใช้การรัน backend จาก host ด้วย `backend/scripts/run_local_api.sh`

### Login แล้วเชื่อมต่อ API ไม่ได้

ให้ตรวจสอบว่า

- frontend ชี้ไปยัง API URL ที่ถูกต้อง
- backend ทำงานอยู่ที่พอร์ต `8000`
- ค่า CORS อนุญาต frontend origin แล้ว

## แนวทางพัฒนาต่อในอนาคต

- เพิ่ม automated tests สำหรับ frontend และ backend
- ทำระบบจัดการ model artifact ให้เป็นอัตโนมัติ
- เพิ่ม model versioning และ monitoring
- เพิ่ม CI/CD สำหรับ build test และ deploy
- ปรับปรุงความแม่นยำของโมเดลด้วยข้อมูลที่หลากหลายมากขึ้น

## สรุป

PawMind เป็นโครงงานที่รวมองค์ประกอบสำคัญของระบบสมัยใหม่ไว้ครบถ้วน ทั้ง Frontend, Backend, Database, AI/ML และ Deployment โดยมีเป้าหมายเพื่อสร้างระบบที่ช่วยให้เจ้าของสุนัขสามารถดูแลสัตว์เลี้ยงได้ดีขึ้นผ่านการใช้ข้อมูลและ AI อย่างเป็นรูปธรรม
