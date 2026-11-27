# ADR-0002: Postgres = Neon ผ่าน Vercel Marketplace

- สถานะ: อนุมัติ (D3 — 2026-11-26)
- วันที่: 2026-11-26

## บริบท

โจทย์ต้องการ “Postgres บน Vercel” แต่ผลิตภัณฑ์ Vercel Postgres เดิมเลิกให้บริการแล้ว ฐานข้อมูลถูกย้ายไป Neon และ `@vercel/postgres` ถูก deprecate (plan.md หัวข้อ 3.1)

## ทางเลือก

1. Neon ผ่าน Vercel Marketplace — ผู้รับช่วง Vercel Postgres เดิมโดยตรง, ตั้ง environment variable ให้อัตโนมัติ, คิดเงินผ่านบิล Vercel
2. Supabase / Prisma Postgres / AWS Aurora Postgres ผ่าน Marketplace

## การตัดสินใจ

Neon ผ่าน Vercel Marketplace · region `aws-ap-southeast-1` (Singapore) ใกล้ Vercel `sin1` · ผู้ใช้สร้างและผูกกับโปรเจกต์ในบัญชีของตัวเองในขั้นที่ 4 (เตรียมขั้นตอนให้ทีละคลิก)

## ผลที่ตามมา

- มี connection string ทั้งแบบ pooled (แอป) และ unpooled/direct (migration) — ชื่อตัวแปรจริงตรวจตอนเชื่อมต่อ
- ใช้ Neon branch สำหรับ Preview, ทดสอบ และสำรองก่อน migration ที่เสี่ยง — การสร้าง branch ต่อ Preview อัตโนมัติขึ้นกับแบบการเชื่อม (สร้างบัญชีใหม่ผ่าน Vercel / ผูกบัญชีเดิม) ตรวจในขั้นที่ 4
- ตรวจข้อจำกัดของแพ็กเกจที่เลือก (ขนาด, ระยะเวลาย้อนข้อมูล) ในขั้นที่ 4 · ย้ายผู้ให้บริการ Postgres ได้ภายหลังเพราะใช้ Drizzle (ADR-0003)
