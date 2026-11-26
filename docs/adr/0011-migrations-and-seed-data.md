# ADR-0011: Migration, ข้อมูลตั้งต้น และการไม่ย้ายข้อมูลธุรกรรม

- สถานะ: ไม่ย้ายข้อมูลธุรกรรม **อนุมัติ** (D8 — GEN-06 Drop ยืนยันพร้อม Parity Matrix 2026-11-26) · วิธี migrate และ seed **เสนอ**
- วันที่: 2026-11-26

## บริบท

- ฐานข้อมูลเดิมไม่มีใบงาน ข้อมูลพื้นฐานเป็นข้อมูลทดสอบ (01-inventory หัวข้อ 8.0) → ไม่มีข้อมูลธุรกรรมให้ย้าย
- ต้องเปลี่ยน schema ซ้ำได้อย่างปลอดภัยทั้งบน Preview และ Production · repo เป็น public (ห้ามมีความลับ)
- ฐานข้อมูลเดิม (`TCRMIS`) ใช้ร่วมกับระบบอื่น — ไม่แตะต้อง

## ทางเลือก (วิธี migrate)

1. รัน migration ด้วยมือก่อน deploy — ลืมง่าย
2. GitHub Actions รัน migration แยกจาก deploy — ต้องจัดลำดับกับ Vercel ให้ดี
3. **รัน `drizzle-kit migrate` เป็นขั้นแรกของ build บน Vercel** — แต่ละ environment migrate ฐานข้อมูล (branch) ของตัวเอง; migrate ไม่ผ่าน = ไม่ deploy

## การตัดสินใจ (เสนอ)

- schema ใน Drizzle → `drizzle-kit generate` → ไฟล์ SQL ใน `drizzle/` ตรวจใน PR → build บน Vercel รัน `drizzle-kit migrate` (connection แบบ unpooled) แล้วจึง `next build`
- **seed แบบรันซ้ำได้ (upsert)**: สถานะงาน 8 ค่าจากฐานข้อมูลเดิม · ประเภทรถตามรายการจริงที่ผู้ใช้ให้ (Q22)
- **Admin คนแรก:** สคริปต์รันครั้งเดียว อ่านชื่อผู้ใช้/รหัสผ่านจาก environment variable ตอนรัน (ไม่ commit) — ผู้ใช้รันเองในขั้นที่ 4
- ไม่มี ETL จากระบบเดิม · ไม่เขียนอะไรลงฐานข้อมูลเดิม

## ผลที่ตามมา

- ขั้นที่ 6 (Data Migration) เหลือ: seed ข้อมูลอ้างอิง + ตรวจจำนวนแถว
- migration ที่ลบ/เปลี่ยนชนิดคอลัมน์บน production ต้องสร้าง Neon branch สำรองก่อน
- ตรวจในขั้นที่ 4: การแยกฐานข้อมูลต่อ Preview (Neon branch) และชื่อตัวแปรที่ใช้ใน build
