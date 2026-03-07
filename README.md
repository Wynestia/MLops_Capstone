# MLops_Capstone
ต้องส่ง 7 อย่าง
1. Slide Presentation
2. Report 20 หน้า
3. Video Presentation ~20 นาที
4. GitHub Repository
   คือ src, readme, setup guide
5. UX/UI Prototype
   คือ Figma
6. Docker Setup ใน repo
7. Live Demo ที่ deploy แล้ว

## Depression detection from Speech
แนวทางการทำ
เป็นแบบทดสอบ แล้วให้ผู้สูงอายุพูดตอบด้วยไมค์
แตกต่างกับปกติยังไง ถ้าทดสอบผ่านแบบทดสอบ ข้อมูลที่ได้จะได้แค่ตัวเลือก\
แต่!!! method นี้เราจะได้ฟีเจอร์น้ำเสียงด้วย
https://www.kaggle.com/datasets/arashnic/the-depression-dataset

## Dog Emotion
https://www.kaggle.com/datasets/danielshanbalico/dog-emotion
https://ieeexplore.ieee.org/document/10775296

รวมหลาย ๆ ชนิด
https://www.kaggle.com/datasets/anshtanwar/pets-facial-expression-dataset?select=Other

## Parkinson Detechtion
https://github.com/SJTU-YONGFU-RESEARCH-GRP/Parkinson-Patient-Speech-Dataset
﻿# PawMind React App

This folder is now structured as a standard React + Vite project.

## Run

```bash
npm install
npm run dev
```

Open: http://127.0.0.1:5173

## Project Structure

- `src/main.jsx` app entry
- `src/App.jsx` app shell/router state
- `src/components/` reusable UI components
- `src/pages/` page-level components
- `src/styles/` theme + global styles
- `src/data/` mock/static data
- `public/` static public assets
- `ml/` ML dataset/model/notebook files (kept separate from frontend)
- `tools/` local tooling binaries

## Notes

- Legacy file from the original single-file app is preserved at:
  - `src/legacy/pawmind-app.jsx`
