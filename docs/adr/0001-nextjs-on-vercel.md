# ADR-0001: Next.js 16 (App Router) + TypeScript บน Vercel

- สถานะ: อนุมัติ (D2 — ยืนยันพร้อมรายการใน 03-feature-parity หัวข้อ 7, 2026-11-26)
- วันที่: 2026-11-26

## บริบท

ระบบเดิมเป็น ASP.NET Core 8 MVC บน IIS (01-inventory) · โจทย์ของผู้ใช้คือสร้างใหม่ด้วย Next.js และ deploy บน Vercel · ต้องมี Preview deployment ให้ผู้ใช้ทดลองก่อนขึ้นจริง

## ทางเลือก

1. Next.js App Router (เวอร์ชัน 16) — Server Components + Server Actions
2. Next.js Pages Router — แบบเก่า ยังรองรับแต่ฟีเจอร์ใหม่ไปลง App Router
3. Framework อื่น (React Router, SvelteKit) — ไม่ตรงโจทย์

## การตัดสินใจ

- Next.js 16.x (ล่าสุด 16.4.6 เมื่อ 2026-11-26) App Router + React 19 + TypeScript strict
- อ่านข้อมูลใน Server Components, เขียนผ่าน Server Actions · ใช้ Node.js runtime (ไม่ใช้ Edge) เพราะต่อฐานข้อมูลด้วย `pg` (ADR-0003)
- Vercel Fluid compute · Functions region Singapore (`sin1`)

## ผลที่ตามมา

- ต้องทำตามการเปลี่ยนแปลงของ Next.js 16 (skill.md หัวข้อ 6): `proxy.ts` แทน `middleware.ts`, `params`/`searchParams`/`cookies()`/`headers()` เป็น async, Turbopack เป็นค่าเริ่มต้น, เรียก ESLint ตรงแทน `next lint` — ยืนยันกับเอกสารทางการตอน scaffold
- Node.js ≥ 20.9 — เลือกเวอร์ชัน LTS ที่ Vercel รองรับในขั้นที่ 4
- ล็อกเวอร์ชันด้วย lockfile และอัปเดตผ่าน PR
