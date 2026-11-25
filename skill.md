---
name: rea-nppool
description: วิธีทำ REA (Reverse Engineering Anything) — ถอดแบบระบบเดิมทุกรูปแบบ (โค้ด ฐานข้อมูล Excel หน้าจอ เอกสาร) แล้วสร้างใหม่เป็น Next.js บน Vercel + Postgres (Neon) แบบทีละขั้นมีจุดอนุมัติ ใช้เมื่อทำงานในโปรเจกต์ NPPool หรือ rebuild ระบบเดิมเป็นเว็บแอป
---

# Skill: REA — Reverse Engineering Anything

คู่มือวิธีการ แม่แบบ และความรู้สะสมของโปรเจกต์ NPPool — ใช้ได้ทั้งคนและ AI agent
แผนงาน → [plan.md](plan.md) · บันทึกการทำงาน → [Roadmap.md](Roadmap.md)

> ต้องการให้ Claude Code โหลดเป็น skill อัตโนมัติ: คัดลอกไฟล์นี้ไปไว้ที่ `.claude/skills/rea/SKILL.md`
> อัปเดตไฟล์นี้ทุกครั้งที่ได้เทคนิคหรือบทเรียนใหม่ (หัวข้อ 8)

## 1. หลักการ

1. **ระบบเดิมคือ spec** — พฤติกรรมทุกอย่างของระบบใหม่ต้องชี้หลักฐานในระบบเดิมได้ (ไฟล์:บรรทัด, ตาราง, หน้าจอ, เอกสาร)
2. **อ่านอย่างเดียว** — ไม่แก้ไขระบบเดิม
3. **ไม่เดา** — ช่องว่างความรู้ → บันทึกเป็นคำถามค้าง (Open Question) แล้วถามเจ้าของระบบ
4. **Parity ก่อน ปรับปรุงทีหลัง** — ไอเดียปรับปรุงจดแยกไว้ใน Improvement backlog
5. **ทีละขั้น มีจุดอนุมัติ** — สรุปผล → ขออนุมัติ → จึงไปต่อ
6. **พิสูจน์ได้** — ทุกฟีเจอร์มีวิธีทดสอบเทียบกับระบบเดิม
7. **ปลอดภัย** — ไม่คัดลอกค่าความลับ, ข้อมูลส่วนบุคคลต้องปิดบังก่อนนำมาใช้

## 2. “Anything” — แหล่งที่ต้องถอด และวิธีถอด

| สิ่งที่พบ | วิธีถอด | ได้อะไร |
|---|---|---|
| Source code | หา entry point, routing/เมนู, model/entity, SQL query, validation, จุดคำนวณ, จุดส่งออกไฟล์ | ฟีเจอร์, กฎธุรกิจ, data model |
| ฐานข้อมูล (SQL Server, MySQL, Access, SQLite …) | ดึง schema, PK/FK, index, constraint, trigger, view, stored procedure; profile ข้อมูล (null, ค่าซ้ำ, ช่วงค่า, จำนวนแถว) | Data dictionary, ER diagram |
| Excel / Google Sheets | ชีต = ตาราง, หัวคอลัมน์ = field, สูตร = กฎธุรกิจ, VBA / Apps Script = logic, Data validation = ค่าที่เลือกได้ (enum) | Data model + กฎธุรกิจ |
| หน้าจอ / ภาพหน้าจอ / ระบบที่รันได้ | ทำ screen inventory, รายการ field, ข้อความแจ้งเตือน, ลำดับการกด (black-box) | UI spec, user flow |
| เอกสาร / แบบฟอร์ม / รายงาน | layout, รูปแบบเลขที่เอกสาร, สูตรยอดรวม/ภาษี, การปัดเศษ | Report spec |
| ความรู้ของผู้ใช้ | ถามตามรายการคำถามค้าง ทีละเรื่อง | กฎที่ไม่มีในโค้ด |

## 3. ขั้นตอนและเช็กลิสต์ (สอดคล้องกับ plan.md)

### ขั้นที่ 1 — Discovery & Inventory

- [ ] ระบุภาษา/เฟรมเวิร์ก/เวอร์ชันจากไฟล์ manifest (`package.json`, `*.csproj`, `composer.json`, `requirements.txt`, `pom.xml` …)
- [ ] วาดโครงสร้างไฟล์ระดับบน + นับขนาด (จำนวนไฟล์ / บรรทัด / ตาราง / แถว)
- [ ] หาวิธีรันและ config (ความลับ: จดตำแหน่ง ห้ามคัดลอกค่า)
- [ ] รายการหน้าจอ/เมนู, รายงาน, การเชื่อมต่อภายนอก, งานตั้งเวลา, ไฟล์อัปโหลด
- [ ] ตรวจ encoding ภาษาไทยและรูปแบบวันที่ (ค.ศ. / พ.ศ.)
- [ ] เขียน `docs/rea/01-inventory.md` + คำถามค้าง

สิ่งที่มักพบในระบบงานขนส่ง/โลจิสติกส์ (ใช้เป็นเช็กลิสต์สำหรับค้นหา **ไม่ใช่ข้อสรุป**): ลูกค้า, ผู้ส่ง-ผู้รับ, ใบงาน/ใบสั่งขนส่ง, รถ, คนขับ, เส้นทาง, อัตราค่าขนส่ง, สถานะการขนส่ง, หลักฐานการส่ง (รูป/ลายเซ็น), ใบแจ้งหนี้/ใบเสร็จ

### ขั้นที่ 2 — Analysis

- [ ] Domain model + ER diagram (Mermaid ใน Markdown)
- [ ] Data dictionary ทุกตาราง/ทุก field (แม่แบบ 4.2)
- [ ] บทบาทผู้ใช้ × สิทธิ์ (role matrix)
- [ ] User flow หลัก
- [ ] กฎธุรกิจทุกข้อพร้อมหลักฐานและตัวอย่าง input → output (แม่แบบ 4.4)
- [ ] Feature Parity Matrix (แม่แบบ 4.3) ให้ผู้ใช้จัดลำดับความสำคัญ

### ขั้นที่ 3 — Target Design

- [ ] Schema Postgres ใหม่ + ตาราง mapping เดิม → ใหม่ (ใช้หัวข้อ 5.3)
- [ ] Route map / หน้าจอใหม่
- [ ] ADR สำหรับการตัดสินใจสำคัญ (แม่แบบ 4.6)

### ขั้นที่ 4–8

ดูรายละเอียดใน plan.md — ทุกโมดูลในขั้นที่ 5 ต้องผ่านลำดับ: schema → migration → logic → UI → test → เทียบผลกับระบบเดิม → อัปเดต Parity Matrix

## 4. แม่แบบเอกสาร

### 4.1 Inventory — `docs/rea/01-inventory.md`

```markdown
# 01 — Inventory ระบบเดิม
- ที่มา: <path / repo / commit>   - วันที่สำรวจ: <YYYY-MM-DD>

## ภาพรวม
| หัวข้อ | ค่า | หลักฐาน |
|---|---|---|
| ภาษา / เฟรมเวิร์ก / เวอร์ชัน | | |
| วิธีรัน | | |
| ฐานข้อมูล / แหล่งข้อมูล | | |
| ขนาด (ไฟล์ / บรรทัด / ตาราง / แถว) | | |

## โครงสร้างไฟล์ (ระดับบน)
## หน้าจอ / เมนู
| # | หน้าจอ | ไฟล์ | ทำอะไร | ใครใช้ |
## ตาราง / แหล่งข้อมูล
## รายงาน / เอกสารที่ออก
## การเชื่อมต่อภายนอก / งานตั้งเวลา / ไฟล์อัปโหลด
## ความลับที่พบ (บอกตำแหน่งเท่านั้น ห้ามคัดลอกค่า)
## คำถามค้าง
```

### 4.2 Data dictionary

| ตาราง | คอลัมน์ | ชนิดเดิม | ความหมาย | ตัวอย่างค่า | Null ได้? | ชนิดใหม่ (Postgres) | หมายเหตุ |
|---|---|---|---|---|---|---|---|

### 4.3 Feature Parity Matrix — `docs/rea/03-feature-parity.md`

| ID | ฟีเจอร์ | หลักฐานในระบบเดิม | ความสำคัญ (M/S/C/Drop) | สถานะ | วิธีทดสอบเทียบ | หมายเหตุ |
|---|---|---|---|---|---|---|

สถานะ: ⬜ ยังไม่ทำ · 🟨 กำลังทำ · ✅ เทียบเท่าแล้ว · ➖ ตัดออก

### 4.4 Business rule — `docs/rea/04-business-rules.md`

| ID | กฎ | เงื่อนไข / สูตร | หลักฐาน | ตัวอย่าง input → output |
|---|---|---|---|---|

### 4.5 คำถามค้าง (Open Questions)

| ID | คำถาม | ผลกระทบ | ถามใคร | คำตอบ / วันที่ |
|---|---|---|---|---|

### 4.6 ADR — `docs/adr/NNNN-<หัวข้อ>.md`

```markdown
# ADR-NNNN: <หัวข้อ>
- สถานะ: เสนอ | อนุมัติ | ถูกแทนที่โดย ADR-XXXX
- วันที่: <YYYY-MM-DD>

## บริบท
## ทางเลือก
## การตัดสินใจ
## ผลที่ตามมา
```

## 5. Tech stack และข้อตกลง

### 5.1 เวอร์ชัน (ตรวจจาก npm เมื่อ 2026-11-25 — ตรวจซ้ำก่อน scaffold)

| แพ็กเกจ | เวอร์ชัน |
|---|---|
| next / create-next-app | 16.4.6 (Node ≥ 20.9) |
| react | 19.3.1 |
| drizzle-orm / drizzle-kit | 0.45.4 / 0.31.11 |
| @neondatabase/serverless | 1.2.1 |
| tailwindcss | 4.3.5 |
| zod | 4.6.7 |
| vitest / @playwright/test | 5.1.1 / 1.65.1 |
| vercel (CLI) | 66.6.0 |
| ~~@vercel/postgres~~ | 0.10.0 — **deprecated ห้ามใช้** |

### 5.2 ข้อตกลงโค้ด (ร่าง — ยืนยันในขั้นที่ 3)

- TypeScript แบบ strict
- โครงสร้าง: `src/app` (routes), `src/db` (schema + client), `src/lib`, `src/features/<module>`
- ฐานข้อมูล: ชื่อตาราง/คอลัมน์ `snake_case`; ในโค้ด TypeScript ใช้ `camelCase` (Drizzle map ให้)
- ทุกตารางมี `id`, `created_at`, `updated_at` (`timestamptz`)
- เงินใช้ `numeric(14,2)` ไม่ใช้ float
- อ่านข้อมูลใน Server Components; เขียนข้อมูลผ่าน Server Actions; API ให้ระบบภายนอกใช้ Route Handlers; validate ด้วย Zod ทุกจุด
- ความลับอยู่ใน Environment Variables เท่านั้น; มี `.env.example` (ไม่มีค่าจริง)

### 5.3 แปลงชนิดข้อมูลเดิม → Postgres

| ระบบเดิม | ชนิดเดิม | Postgres |
|---|---|---|
| SQL Server | `nvarchar` / `varchar` | `text` หรือ `varchar(n)` |
| SQL Server | `datetime` / `datetime2` | `timestamp` (ถ้ารู้ timezone ของข้อมูล → `timestamptz`) |
| SQL Server | `bit` | `boolean` |
| SQL Server | `money` / `decimal(p,s)` | `numeric(p,s)` |
| SQL Server | `uniqueidentifier` | `uuid` |
| SQL Server | `int IDENTITY` | `integer generated always as identity` |
| MySQL | `tinyint(1)` | `boolean` |
| MySQL | `enum(...)` | `text` + `check` หรือ Postgres enum |
| MS Access | Yes/No · Currency · AutoNumber · Long Text | `boolean` · `numeric(19,4)` · identity · `text` |
| Excel | วันที่แบบ serial number | `date` (นับวันจาก 1899-12-30) |

### 5.4 คำสั่งที่ใช้บ่อย (ยืนยันจริงตอนขั้นที่ 4)

```bash
npx create-next-app@latest        # scaffold โปรเจกต์ (ขั้นที่ 4)
npm run dev                       # รันบนเครื่อง
npx drizzle-kit generate          # สร้างไฟล์ migration จาก schema
npx drizzle-kit migrate           # รัน migration
vercel link                       # ผูกโฟลเดอร์กับ Vercel project
vercel env pull .env.local        # ดึง Environment Variables มาใช้บนเครื่อง
```

## 6. ข้อควรระวัง (Gotchas)

### Vercel / Neon

- **Vercel Postgres เลิกให้บริการแล้ว** — “ใช้ Vercel Postgres” ในปัจจุบัน = ติดตั้ง Neon จาก Vercel Marketplace; ใช้ `@neondatabase/serverless` ไม่ใช้ `@vercel/postgres`
- Connection string มีทั้งแบบ pooled (ใช้กับแอป) และ direct/unpooled (ใช้รัน migration) — ใช้ให้ถูกตัว ชื่อตัวแปรจริงตรวจตอนเชื่อมต่อ
- Driver แบบ HTTP ของ Neon เหมาะกับ query สั้นๆ; งานที่ต้องใช้ transaction หลายคำสั่ง (เช่น สร้างใบงาน + รายการ + เลขที่เอกสาร) ให้ใช้แบบ WebSocket/Pool — ตรวจกับเอกสาร Drizzle ตอนขั้นที่ 4
- Serverless ไม่มีดิสก์ถาวร — ไฟล์อัปโหลด/รูปใช้ Vercel Blob; งานตั้งเวลาใช้ Vercel Cron; งานที่ใช้เวลานานต้องแบ่งเป็นชิ้น (ตรวจ limit ของแพ็กเกจ Vercel ที่ใช้)
- ตั้ง region ของฐานข้อมูลและ Functions ให้อยู่ใกล้กัน (เช่น Singapore) เพื่อลด latency
- Server บน Vercel ทำงานด้วยเวลา UTC

### Next.js 16 (ยืนยันกับเอกสารทางการอีกครั้งตอน scaffold)

- Turbopack เป็นค่าเริ่มต้นของ `next dev` และ `next build`
- `middleware.ts` เปลี่ยนชื่อเป็น `proxy.ts`
- `params`, `searchParams`, `cookies()`, `headers()` เป็น async — ต้อง `await`
- เลิกคำสั่ง `next lint` — เรียก ESLint โดยตรง

### ข้อมูลภาษาไทยและธุรกิจไทย

- ระบบเก่าอาจเก็บภาษาไทยแบบ TIS-620 / Windows-874 → แปลงเป็น UTF-8 ตอนย้ายข้อมูล และตรวจว่าอ่านออกจริง
- ระบบเก่าอาจเก็บปีเป็น พ.ศ. → เก็บใหม่เป็น ค.ศ. เสมอ (พ.ศ. − 543) แล้วแสดงผลด้วย locale `th-TH` (แสดงเป็น พ.ศ. ให้อัตโนมัติ)
- เวลา: เก็บเป็น `timestamptz` (UTC) และแสดงผลด้วย `timeZone: 'Asia/Bangkok'` ทุกครั้ง
- เงิน: ใช้ `numeric` — โดยปริยาย Drizzle คืนค่าเป็น string ห้ามคำนวณด้วย float; ตรวจวิธีปัดเศษ (ต่อรายการ หรือท้ายบิล) และภาษี (VAT, หัก ณ ที่จ่าย) ให้ตรงกับระบบเดิม
- เลขที่เอกสาร (running number) ต้องกันเลขซ้ำเมื่อมีผู้ใช้พร้อมกัน — ใช้ sequence หรือ row lock ภายใน transaction
- การเรียงชื่อภาษาไทย: ทดสอบ collation ของ Postgres หรือเรียงฝั่งแอปด้วย `Intl.Collator('th')`
- ข้อมูลส่วนบุคคล (ชื่อ, เบอร์โทร, เลขบัตรประชาชน, ที่อยู่) ห้าม commit; ข้อมูลตัวอย่างต้องปิดบังก่อน

### Repo และความปลอดภัย

- Repo `ATTAKORNTH2010/NPPOOL` เป็น **public** — `.env*` ต้องอยู่ใน `.gitignore` และความลับเก็บบน Vercel เท่านั้น
- ตรวจ visibility ของ repo ทุกครั้งก่อนให้ push งานเดิมหรือข้อมูลขึ้น GitHub

## 7. วิธีทำงานกับผู้ใช้ (Workflow)

1. อ่าน `plan.md` และ `Roadmap.md` ก่อนเริ่มทุกเซสชัน
2. ทำเฉพาะขั้นที่อนุมัติแล้ว
3. จบงานแต่ละครั้ง: บันทึก Roadmap (ทำอะไร / ผลลัพธ์ / ถัดไป / blocker) → commit → push → สรุปให้ผู้ใช้ + ขออนุมัติขั้นถัดไป
4. ได้เทคนิคหรือบทเรียนใหม่ → เพิ่มในหัวข้อ 8
5. งานที่ต้องอ่านไฟล์บนเครื่องผู้ใช้ (เช่น งานเดิม) ทำในเซสชันบนเครื่องผู้ใช้; เซสชันคลาวด์ทำได้เฉพาะสิ่งที่อยู่ใน repo — ส่งต่อสถานะกันผ่าน `Roadmap.md` บน GitHub และให้ทำงานบน branch ทีละเซสชัน (pull ก่อนเริ่ม) เพื่อไม่ให้ commit ชนกัน

## 8. บทเรียน (Lessons learned) — เพิ่มต่อท้าย

| วันที่ | บทเรียน |
|---|---|
| 2026-11-25 | Vercel Postgres เลิกให้บริการแล้ว (`@vercel/postgres` deprecated) — Postgres บน Vercel ปัจจุบันคือ Neon ผ่าน Marketplace |
| 2026-11-25 | งานเดิมอยู่บนเครื่องผู้ใช้ — เซสชันคลาวด์ต้องให้ push ขึ้น GitHub หรือแชร์โฟลเดอร์ก่อน จึงควรตรวจการเข้าถึงเป็นอย่างแรกของงาน REA |
| 2026-11-25 | Repo เป็น public — ตรวจ visibility ก่อนรับงานเดิม/ข้อมูลเข้า repo |
| 2026-11-25 | Windows ไม่แยกตัวพิมพ์เล็ก-ใหญ่ของชื่อโฟลเดอร์ — clone repo `NPPOOL` ไว้คนละชื่อกับโฟลเดอร์งานเดิม `NPPool` (ใช้ `C:\Projects\NPPOOL-web`) |
| 2026-11-25 | เปิด Remote Control แล้วแต่รายการโฟลเดอร์ของเซสชันคลาวด์ยังว่าง — จึงใช้วิธี C (ทำงานในเซสชันบนเครื่องผู้ใช้) |
