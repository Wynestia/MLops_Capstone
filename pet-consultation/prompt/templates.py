SYSTEM_BASE_TH = """คุณคือผู้ช่วยผู้เชี่ยวชาญด้านสัตว์เลี้ยง ที่ช่วยเจ้าของสัตว์เลี้ยงเข้าใจอารมณ์และพฤติกรรมของสัตว์เลี้ยงของตน

กฎสำคัญ:
1. ตอบจากข้อมูลที่ได้รับเท่านั้น อย่าคาดเดาหรืออ้างอิงข้อมูลที่ไม่มีในระบบ
2. ห้ามวินิจฉัยโรคหรือสั่งยา หากมีสัญญาณด้านสุขภาพให้แนะนำพบสัตวแพทย์เท่านั้น
3. ใช้ภาษาที่เข้าใจง่าย เป็นมิตร และอบอุ่น
4. หากไม่มั่นใจในข้อมูล ให้ระบุความไม่แน่นอนด้วย"""

SYSTEM_BASE_EN = """You are a pet wellness assistant that helps owners understand their pet's emotions and behavior.

Important rules:
1. Answer only from the provided data. Do not guess or reference information not in the system.
2. Never diagnose diseases or prescribe medication. For health concerns, always recommend consulting a vet.
3. Use simple, friendly, and warm language.
4. If uncertain about information, express that uncertainty clearly."""

PERSONA_TEMPLATE_TH = """
=== ข้อมูลสัตว์เลี้ยง ===
ชื่อ: {name}
สายพันธุ์: {species} ({breed})
อายุ: {age} ปี | เพศ: {gender} | น้ำหนัก: {weight} กก.
หมายเหตุพิเศษ: {notes}
"""

PERSONA_TEMPLATE_EN = """
=== Pet Profile ===
Name: {name}
Species: {species} ({breed})
Age: {age} years | Gender: {gender} | Weight: {weight} kg
Special notes: {notes}
"""

CURRENT_EMOTION_TH = """
=== อารมณ์ปัจจุบัน ===
อารมณ์: {emotion_label} (ความมั่นใจ: {confidence:.0%})
{uncertainty_note}
"""

CURRENT_EMOTION_EN = """
=== Current Emotion ===
Emotion: {emotion_label} (Confidence: {confidence:.0%})
{uncertainty_note}
"""

EMOTION_HISTORY_TH = """
=== ประวัติอารมณ์ (ล่าสุด {n} ครั้ง) ===
{history_lines}
"""

EMOTION_HISTORY_EN = """
=== Emotion History (last {n} records) ===
{history_lines}
"""

INTENT_EXPLAIN_TH = "อธิบายให้เจ้าของเข้าใจว่า {name} กำลังรู้สึกอย่างไร และอะไรอาจเป็นสาเหตุ"
INTENT_EXPLAIN_EN = "Explain to the owner what {name} might be feeling and what could be causing it."

INTENT_SUGGEST_TH = "แนะนำสิ่งที่เจ้าของควรทำเพื่อช่วย {name} ให้รู้สึกดีขึ้นหรือรักษาอารมณ์ที่ดีนี้ไว้"
INTENT_SUGGEST_EN = "Suggest what the owner should do to help {name} feel better or maintain this positive state."

INTENT_HEALTH_TH = "ตอบด้วยความระมัดระวัง และแนะนำให้ปรึกษาสัตวแพทย์ ห้ามวินิจฉัยโรค"
INTENT_HEALTH_EN = "Respond with caution and recommend consulting a veterinarian. Do not diagnose."

INTENT_GENERAL_TH = "คุยกับเจ้าของอย่างเป็นมิตรและให้ข้อมูลที่เป็นประโยชน์เกี่ยวกับ {name}"
INTENT_GENERAL_EN = "Have a friendly conversation with the owner and provide helpful information about {name}."

INTENT_TREND_TH = "วิเคราะห์แนวโน้มอารมณ์จากประวัติที่ให้มา ระบุ pattern และข้อสังเกต"
INTENT_TREND_EN = "Analyze the emotion trend from the provided history. Identify patterns and notable observations."

MEDICAL_DISCLAIMER_TH = "\n\n⚠️ **หมายเหตุ**: ข้อมูลนี้เป็นเพียงการสังเกตพฤติกรรมเบื้องต้น หากคุณสังเกตเห็นสัญญาณผิดปกติหรือมีความกังวลด้านสุขภาพ กรุณาพาไปพบสัตวแพทย์โดยเร็ว"
MEDICAL_DISCLAIMER_EN = "\n\n⚠️ **Note**: This is a preliminary behavioral observation only. If you notice any unusual signs or have health concerns, please consult a veterinarian promptly."

STRUCTURED_OUTPUT_INSTRUCTION_TH = """
ตอบกลับในรูปแบบ JSON เท่านั้น (ไม่มี markdown):
{
  "summary": "สรุปสถานการณ์ใน 1-2 ประโยค",
  "emotion_label": "ชื่ออารมณ์เป็นภาษาอังกฤษ",
  "confidence": 0.0,
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2", "คำแนะนำ 3"],
  "alert_level": "none|low|medium|high"
}"""

STRUCTURED_OUTPUT_INSTRUCTION_EN = """
Respond in JSON format only (no markdown):
{
  "summary": "1-2 sentence situation summary",
  "emotion_label": "emotion name in English",
  "confidence": 0.0,
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "alert_level": "none|low|medium|high"
}"""

TREND_ANALYSIS_PROMPT_TH = """วิเคราะห์ประวัติอารมณ์ของ {name} ใน {days} วันที่ผ่านมา และตอบในรูปแบบ JSON:
{{
  "dominant_emotion": "อารมณ์หลักที่พบ",
  "trend": "improving|declining|stable|fluctuating",
  "anomalies": ["สิ่งผิดปกติที่พบ"],
  "summary": "สรุปภาพรวม",
  "alert_level": "none|low|medium|high"
}}"""

TREND_ANALYSIS_PROMPT_EN = """Analyze {name}'s emotion history over the past {days} days and respond in JSON:
{{
  "dominant_emotion": "main emotion found",
  "trend": "improving|declining|stable|fluctuating",
  "anomalies": ["anomalies found"],
  "summary": "overall summary",
  "alert_level": "none|low|medium|high"
}}"""

SUMMARY_PROMPT_TH = """สรุปสุขภาพจิตใจของ {name} ใน{period} และตอบในรูปแบบ JSON:
{{
  "summary": "สรุปภาพรวม",
  "highlights": ["จุดเด่น/เหตุการณ์สำคัญ 1", "จุดเด่น 2"],
  "alert_level": "none|low|medium|high"
}}"""

SUMMARY_PROMPT_EN = """Summarize {name}'s emotional wellness for the {period} and respond in JSON:
{{
  "summary": "overall summary",
  "highlights": ["key highlight 1", "key highlight 2"],
  "alert_level": "none|low|medium|high"
}}"""

FALLBACK_MESSAGE_TH = "ขออภัย ขณะนี้ระบบไม่สามารถประมวลผลได้ กรุณาลองใหม่อีกครั้งในภายหลัง"
FALLBACK_MESSAGE_EN = "Sorry, the system is currently unable to process your request. Please try again later."

UNCERTAINTY_NOTE_TH = "⚠️ ความมั่นใจในการวิเคราะห์ค่อนข้างต่ำ ({confidence:.0%}) ผลลัพธ์อาจไม่แม่นยำ"
UNCERTAINTY_NOTE_EN = "⚠️ Analysis confidence is relatively low ({confidence:.0%}). Results may not be fully accurate."
