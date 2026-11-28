# NPPool — แผนงาน REA (Reverse Engineering Anything)

> **สถานะ:** ฉบับร่าง v0.9 · 2026-11-28 · ขั้นที่ 0–4 เสร็จและอนุมัติแล้ว (Production: `webnppool.vercel.app`) · **🟨 ขั้นที่ 5 Rebuild — โมดูล 1–2 ✅ · โมดูล 3 ใบงาน + โมดูล 4 พิมพ์ + คำขอเพิ่ม (แก้ไข/ลบ/ค้นหา/Excel/Activity Logs, โลโก้, D25–D34) ขึ้น Production 2026-11-28 (PR #6) · รอบแก้ 2 (Activity Logs ทุกผู้ใช้, ราคาตามราคาน้ำมัน, โลโก้ใหม่ — D37–D39) รอตรวจ**
> บันทึกการทำงาน → [Roadmap.md](Roadmap.md) · วิธีการ แม่แบบ และความรู้ → [skill.md](skill.md)

---

## 1. เป้าหมาย

ถอดแบบระบบ NPPool เดิมที่ `C:\Projects\NPPool` แล้วสร้างใหม่เป็นเว็บแอปที่

1. พัฒนาด้วย **Next.js** และ deploy บน **Vercel**
2. ใช้ฐานข้อมูล **Postgres บน Vercel** (อ่านหมายเหตุในหัวข้อ 3.1)

หลักการ: ทำให้ **ฟีเจอร์และกฎทางธุรกิจเทียบเท่าระบบเดิม (feature parity)** ก่อน แล้วจึงปรับปรุงเพิ่มเติม

## 2. สิ่งที่รู้แล้ว / ยังไม่รู้ (ณ 2026-11-26)

| หัวข้อ | สถานะ |
|---|---|
| GitHub repo `ATTAKORNTH2010/NPPOOL` | เอกสาร REA อยู่บน branch `claude/nppool-reverse-engineering-gvbib9` — ไม่มีโค้ดของงานเดิม (ตั้งใจไม่นำขึ้น) |
| การมองเห็น repo | **public** → ห้าม commit รหัสผ่าน, API key, connection string หรือข้อมูลลูกค้า |
| งานเดิม `C:\Projects\NPPool` | ✅ อ่านได้จากเซสชันบนเครื่องผู้ใช้ (วิธี C) |
| ภาษา/เฟรมเวิร์กเดิม, ฟีเจอร์, ฐานข้อมูล, ผู้ใช้และสิทธิ์ | ✅ ASP.NET Core 8 MVC + Dapper + SQL Server · 9 หน้าจอ · 12 ตาราง + 14 view · 3 บทบาท — ดู [01-inventory.md](docs/rea/01-inventory.md) |
| ระบบที่ใช้งานจริงและข้อมูล | ✅ ระบบไม่ได้เปิดใช้งานแล้ว (ใช้ซอร์สล่าสุดเป็นต้นแบบ) · ฐานข้อมูลบนเครื่องผู้ใช้ไม่มีใบงาน ข้อมูลพื้นฐานเป็นข้อมูลทดสอบ · ไม่มี FK (01-inventory หัวข้อ 8.0) |
| Domain model, กฎธุรกิจ, Parity Matrix | ✅ ขั้นที่ 2 ยืนยันแล้ว — [02](docs/rea/02-domain-model.md) · [03](docs/rea/03-feature-parity.md) · [04](docs/rea/04-business-rules.md) · MVP 25 รายการ |
| แบบระบบใหม่ | ✅ ขั้นที่ 3 อนุมัติ 2026-11-27 — [design](docs/design/01-architecture.md) · [ADR](docs/adr/README.md) |
| กฎธุรกิจที่ไม่อยู่ในโค้ด | 🟨 ส่วนใหญ่ใช้ค่าเริ่มต้นที่ยืนยันแล้ว · Q9 ตอบแล้ว 2026-11-27 (แก้ไขใบงานได้) · ยังเปิด: Q4, Q10 (ลำดับสถานะ), Q12, Q13, Q16, Q18, Q21, Q22 (ประเภทรถจริง), Q23, Q27, Q28 — 01-inventory หัวข้อ 15 · ช่องในใบพิมพ์ที่ใบงานยังไม่มี (Ref.No, CS Name, AWB No., เขต/แขวง, จังหวัด) — [docs/PrintForm](docs/PrintForm/README.md) |

## 3. ทิศทางเทคโนโลยีที่เสนอ (ตรวจเวอร์ชันจาก npm เมื่อ 2026-11-25)

| ส่วน | ที่เสนอ | เหตุผล / หมายเหตุ |
|---|---|---|
| Framework | **Next.js 16** (App Router, ล่าสุด 16.4.6) + React 19 + TypeScript ✅ อนุมัติ (D2, ADR-0001) | ตามโจทย์ และเป็นเฟรมเวิร์กที่ Vercel รองรับดีที่สุด |
| Runtime | Node.js **24.x** (`engines` ใน package.json + CI) — เสนอ D23 ในขั้นที่ 4 | Next.js 16 ต้องการ ≥ 20.9 · ใช้ LTS ล่าสุดที่ Vercel รองรับ |
| Database | **Postgres ผ่าน Vercel Marketplace → Neon** ✅ อนุมัติ (D3, 2026-11-26) | Vercel Postgres เดิมเลิกให้บริการแล้ว (หัวข้อ 3.1) |
| DB driver | ✅ อนุมัติ `pg` Pool + `attachDatabasePool` บน Vercel Fluid ([ADR-0003](docs/adr/0003-drizzle-and-db-connection.md)) | ต้องใช้ transaction แบบ interactive · ไม่ใช้ `@vercel/postgres` ที่ถูก deprecate |
| ORM / Migration | **Drizzle ORM + drizzle-kit** ✅ อนุมัติ (D4, 2026-11-26) | type-safe, เบา, เหมาะกับ serverless, migration เป็นไฟล์ SQL อ่านตรวจง่าย |
| Validation | Zod | ตรวจข้อมูลเข้าที่ Server Action / API ทุกจุด |
| UI | ✅ อนุมัติ Tailwind CSS v4 + shadcn/ui + ฟอนต์ไทย ([ADR-0006](docs/adr/0006-ui-kit-and-thai-fonts.md)) | |
| Auth | ✅ อนุมัติ Better Auth — username + admin plugin ([ADR-0004](docs/adr/0004-auth-better-auth.md)) | Auth.js อยู่ในความดูแลของทีม Better Auth แล้ว · ไม่ย้ายรหัสผ่านเดิม |
| PDF / พิมพ์ | ✅ เลือก A: หน้า HTML สำหรับพิมพ์ / บันทึก PDF จาก browser ([ADR-0005](docs/adr/0005-job-order-printing.md)) | ระบบเดิมใช้ wkhtmltopdf (.exe) ซึ่งใช้บน Vercel ไม่ได้ |
| Test | Vitest (unit + integration บน PGlite ที่รัน migration จริง) + Playwright (E2E บน Preview / เทียบผลกับระบบเดิม) | integration test ไม่ต้องมีฐานข้อมูลภายนอก |
| CI/CD | GitHub Actions (lint, typecheck, test, build) + Vercel Git Integration | Preview ทุก branch, Production จาก `main` |
| Region | ฐานข้อมูลและ Functions อยู่ Singapore (ใกล้ผู้ใช้ในไทย) | ✅ Neon `aws-ap-southeast-1` + Functions `sin1` (`vercel.json`) |

### 3.1 หมายเหตุสำคัญเรื่อง “Vercel Postgres”

- ผลิตภัณฑ์ **Vercel Postgres เดิมเลิกให้บริการแล้ว** — ฐานข้อมูลเดิมถูกย้ายไป Neon ตั้งแต่ ธ.ค. 2024 และแพ็กเกจ `@vercel/postgres` ถูก deprecate (npm แจ้งไว้ชัดเจน)
- วิธีปัจจุบันในการมี Postgres บน Vercel: Vercel Dashboard → Storage / Marketplace → **Neon** → ผูกกับโปรเจกต์ → Vercel ใส่ connection string เป็น Environment Variables ให้อัตโนมัติ, คิดเงินผ่านบิล Vercel, เปิดดูตาราง/รัน SQL จาก Dashboard ได้ (เอกสาร Neon ฉบับปัจจุบันเรียกฐานข้อมูลนี้ว่า “Lakebase Postgres”)
- ตอนติดตั้งมี 2 แบบ: *Create New Neon Account* (Vercel จัดการบัญชีและบิลให้) หรือ *Link Existing Neon Account* — ✅ ตรวจแล้วในขั้นที่ 4: แบบ *Create New Neon Account* (Vercel-Managed) สร้าง branch ต่อ Preview ได้ โดยติ๊ก “Create database branch for deployment: Preview” ตอนเชื่อม project (D21, [runbook 01](docs/runbook/01-vercel-neon-setup.md))
- ทางเลือกอื่นใน Marketplace มีเช่น Supabase, Prisma Postgres, AWS Aurora Postgres — เสนอ Neon เพราะเป็นผู้ให้บริการที่รับช่วง Vercel Postgres เดิมโดยตรง
- **จึงเสนอให้ใช้ Neon ผ่าน Vercel Marketplace ในฐานะ “Vercel Postgres” ฉบับปัจจุบัน** — ✅ ผู้ใช้อนุมัติแล้ว 2026-11-26

อ้างอิง: [Vercel Docs — Postgres](https://vercel.com/docs/postgres) · [Neon บน Vercel Marketplace](https://vercel.com/marketplace/neon) · [Neon — Vercel native integration](https://neon.com/docs/guides/vercel-native-integration) · [Neon — Vercel Postgres transition guide](https://neon.com/docs/guides/vercel-postgres-transition-guide)

## 4. แผนงานทีละขั้น

ทุกขั้นจบด้วย **⏸ จุดอนุมัติ** — จะไม่เริ่มขั้นถัดไปจนกว่าผู้ใช้อนุมัติ

### ขั้นที่ 0 — เตรียมการและเข้าถึงงานเดิม ✅

- [x] สำรวจ repo และตรวจเวอร์ชันเทคโนโลยีปัจจุบัน
- [x] ร่าง `plan.md`, `Roadmap.md`, `skill.md`
- [x] ผู้ใช้ให้ดำเนินการต่อตามแผน (2026-11-25)
- [ ] ผู้ใช้ยืนยันทิศทางเทคโนโลยี (หัวข้อ 3) — D3 Neon และ D4 Drizzle อนุมัติแล้ว 2026-11-26 · D2 Next.js 16 + TypeScript ยังรอยืนยัน
- [x] เลือกวิธีเข้าถึงงานเดิม — ลองวิธี B (Remote Control) แต่เซสชันคลาวด์ยังมองไม่เห็นโฟลเดอร์ → ผู้ใช้เลือก **วิธี C** (2026-11-25)

**ผลลัพธ์:** เอกสาร 3 ไฟล์ + เข้าถึงงานเดิมได้ · **⏸ อนุมัติแผน → เริ่มขั้นที่ 1**

### ขั้นที่ 1 — สำรวจและทำบัญชีรายการ (Discovery & Inventory) ✅ *เสร็จและอนุมัติ 2026-11-26*

อ่านอย่างเดียว ไม่แก้ไขงานเดิม

- โครงสร้างไฟล์, ภาษา/เฟรมเวิร์ก/เวอร์ชัน, dependencies, วิธีรันงานเดิม
- แหล่งข้อมูล: ฐานข้อมูล / ไฟล์ Excel / ไฟล์อื่น — schema, ความสัมพันธ์, ปริมาณข้อมูล
- หน้าจอและเมนู, รายงาน/เอกสารที่พิมพ์ออก, การเชื่อมต่อภายนอก, งานตั้งเวลา, ไฟล์อัปโหลด
- ความลับใน config (จดว่า “อยู่ที่ไหน” เท่านั้น ไม่คัดลอกค่า)
- รวบรวมคำถามค้าง (Open Questions)

**ผลลัพธ์:** `docs/rea/01-inventory.md` + `docs/rea/sql/01-inventory-readonly.sql` · **⏸ อนุมัติ → ขั้นที่ 2**

### ขั้นที่ 2 — ถอดแบบระบบเดิม (Analysis) ✅ *เสร็จและยืนยัน 2026-11-26*

- Domain model / ER diagram + Data dictionary
- ผู้ใช้ บทบาท และสิทธิ์
- User flow / use case หลัก
- กฎทางธุรกิจและสูตรคำนวณ พร้อมอ้างอิงตำแหน่งในระบบเดิม
- **Feature Parity Matrix** — ฟีเจอร์ทั้งหมด + ระดับความสำคัญ (Must / Should / Could / Drop)

**ผลลัพธ์:** `docs/rea/02-domain-model.md` (รวม role matrix และ user flow), `03-feature-parity.md`, `04-business-rules.md` · **⏸ ผู้ใช้ยืนยันว่าถอดแบบถูกต้อง + เลือกขอบเขต MVP** (รายการที่ขอยืนยันอยู่ใน 03 หัวข้อ 7)

### ขั้นที่ 3 — ออกแบบระบบใหม่ (Target Design) ✅ *เสร็จ 2026-11-26 · อนุมัติ 2026-11-27*

- สถาปัตยกรรม, โครงสร้างโฟลเดอร์, แผนผังหน้าจอ (route map)
- Postgres schema ใหม่ + ตาราง mapping ข้อมูลเดิม → ใหม่
- เลือก Auth, UI kit, ที่เก็บไฟล์ (Vercel Blob ถ้าจำเป็น), งานตั้งเวลา (Vercel Cron ถ้าจำเป็น)
- กลยุทธ์ย้ายข้อมูล
- บันทึกการตัดสินใจเป็น ADR

**ผลลัพธ์:** `docs/design/*` (สถาปัตยกรรม, หน้าจอ/route map, ฐานข้อมูล + mapping), `docs/adr/*` (11 ฉบับ) · **⏸ อนุมัติแบบ**

### ขั้นที่ 4 — วางรากฐานโปรเจกต์ (Foundation) ✅ *เสร็จ 2026-11-27 — Production ขึ้นก่อน Preview เพราะ merge `main` แล้ว*

- ✅ Scaffold Next.js 16 + TypeScript + Tailwind + ESLint (+ shadcn/ui บน Base UI)
- ✅ Drizzle: schema ครบตาม design 03, migration `drizzle/0000_init.sql`, seed แบบรันซ้ำได้
- ✅ `.env.example` และ `.gitignore` กันความลับหลุด (repo เป็น public) · `npm run env:check`
- ✅ GitHub Actions CI (lint, typecheck, test, migration ตรง schema, build)
- ✅ Layout หลัก + ระบบ login (Better Auth, เมนูตามบทบาท, session 30 นาที)
- ✅ ขั้นตอนทีละคลิก: [runbook 01](docs/runbook/01-vercel-neon-setup.md)
- ✅ ผู้ใช้สร้าง/เชื่อม Vercel project และติดตั้ง Neon จาก Marketplace ในบัญชีของตัวเอง → deployment แรก (Production) → login ด้วยบัญชีผู้ดูแลได้

**ผลลัพธ์:** แอปตั้งต้นที่ deploy บน Vercel และต่อฐานข้อมูลได้ · **⏸ อนุมัติ**

### ขั้นที่ 5 — สร้างฟีเจอร์ตาม Parity Matrix (Rebuild) — ทีละโมดูล 🟨 *เริ่ม 2026-11-27 · โมดูล 1 ผู้ใช้และสิทธิ์*

- ต่อโมดูล: schema → migration → server logic → UI → test → เทียบกับระบบเดิม → อัปเดต matrix
- ลำดับที่เสนอในขั้นที่ 2: ผู้ใช้และสิทธิ์ → ข้อมูลพื้นฐาน + ข้อมูลตั้งต้น → ใบงาน → ใบสั่งปฏิบัติงาน PDF (03-feature-parity หัวข้อ 5)

**ผลลัพธ์:** โมดูลที่ผ่านการทดสอบบน Preview · **⏸ อนุมัติทีละโมดูล**

### ขั้นที่ 6 — ย้ายข้อมูล (Data Migration) — ถ้างานเดิมมีข้อมูลจริง

> ผลขั้นที่ 1: ฐานข้อมูลเดิมไม่มีใบงานและข้อมูลพื้นฐานเป็นข้อมูลทดสอบ → ถ้าผู้ใช้ยืนยัน (Q25, D8) ขั้นนี้เหลือแค่ seed ข้อมูลอ้างอิง (สถานะงาน, ประเภทรถจริง, DOPA ถ้าต้องใช้)

- Script ETL เดิม → Postgres ที่รันซ้ำได้ (idempotent)
- ตรวจผล: จำนวนแถว, ผลรวมยอดเงิน/ยอดสำคัญ, สุ่มเทียบรายรายการ
- ซ้อมบนฐานข้อมูลทดสอบก่อนเสมอ

**ผลลัพธ์:** รายงานผลการย้ายข้อมูล · **⏸ อนุมัติ**

### ขั้นที่ 7 — ทดสอบเทียบระบบเดิมและ UAT

- E2E ตาม user flow หลัก, เทียบผลคำนวณและรายงานกับระบบเดิม
- ผู้ใช้ทดลองใช้งานบน Preview และแจ้งปัญหา

**ผลลัพธ์:** รายงานผลทดสอบ + รายการแก้ไข · **⏸ อนุมัติขึ้นระบบจริง**

### ขั้นที่ 8 — ขึ้นระบบจริงและส่งมอบ (Go-live & Handover)

- Production deployment, โดเมน, backup/restore, monitoring
- แผน cutover และ rollback
- Runbook + อัปเดตบทเรียนใน `skill.md`

**ผลลัพธ์:** ระบบใหม่ใช้งานจริง · **⏸ ปิดงาน**

## 5. วิธีให้เข้าถึงงานเดิม (เลือก 1 วิธี)

เซสชันนี้รันบนคลาวด์ จึงอ่านไฟล์บนเครื่อง Windows ของผู้ใช้โดยตรงไม่ได้

| วิธี | ทำอย่างไร | ข้อดี / ข้อควรระวัง |
|---|---|---|
| **A. Push งานเดิมขึ้น GitHub** (แนะนำ) | คัดลอกงานเดิมไว้ในโฟลเดอร์ `legacy/` แล้ว push ขึ้น `main` | ได้สำเนาอ้างอิงถาวรสำหรับทุกเซสชัน · **repo เป็น public** → เปลี่ยนเป็น private ก่อน หรือเอาความลับและข้อมูลลูกค้าออกให้หมด |
| B. แชร์โฟลเดอร์ผ่าน Remote Control | Claude desktop app บนเครื่องนั้น → Settings → Claude Code → Remote Control | หน้านั้นอาจไม่มีปุ่มเพิ่มโฟลเดอร์ และแม้แชร์แล้วก็อาจใช้จากเซสชันคลาวด์ไม่ได้ |
| **C. ทำงานต่อในเซสชันบนเครื่องของผู้ใช้** ✅ เลือกแล้ว | เริ่มเซสชัน Claude Code บนเครื่องนั้น (ขั้นตอนด้านล่าง) | ใช้แผนและเอกสารชุดนี้ต่อได้ทันที · ไม่ต้องนำงานเดิมขึ้น GitHub |

### ขั้นตอนวิธี C (เลือกแล้ว · 2026-11-25)

โครงสร้างบนเครื่องผู้ใช้:

- `C:\Projects\NPPool` — งานเดิม (อ่านอย่างเดียว ไม่นำขึ้น GitHub)
- `C:\Projects\NPPOOL-web` — clone ของ repo นี้ ใช้เก็บเอกสาร REA และโค้ด Next.js (ชื่อต้องไม่ซ้ำกับ `NPPool` เพราะ Windows ไม่แยกตัวพิมพ์เล็ก-ใหญ่) — ผู้ใช้ clone จริงไว้ที่ `C:\Projects\WebNPPOOL`

1. Clone repo บน branch งาน

   ```bash
   git clone -b claude/nppool-reverse-engineering-gvbib9 https://github.com/ATTAKORNTH2010/NPPOOL.git C:/Projects/NPPOOL-web
   ```

2. เริ่มเซสชัน Claude Code บนเครื่อง (ไม่ใช่บนคลาวด์) ในโฟลเดอร์ `C:\Projects\NPPOOL-web` — ผ่าน Claude desktop app หรือรัน `claude remote-control` ใน terminal ที่โฟลเดอร์นั้น (เซสชันจะไปแสดงใน Claude Code app)
3. วางข้อความส่งต่องานนี้เป็นข้อความแรกของเซสชัน

   ```text
   ทำโปรเจกต์ NPPool (REA — Reverse Engineering Anything) ต่อจากเซสชันบนคลาวด์

   ที่อยู่ของงาน
   - โฟลเดอร์ที่ทำงานนี้ = repo ATTAKORNTH2010/NPPOOL branch claude/nppool-reverse-engineering-gvbib9 — อ่าน plan.md, Roadmap.md, skill.md ให้ครบก่อนเริ่ม
   - งานเดิมอยู่ที่ C:\Projects\NPPool — อ่านอย่างเดียว ห้ามแก้ไข ห้ามคัดลอกเข้ามาใน repo

   สถานะ
   - ขั้นที่ 0 เสร็จแล้ว ผู้ใช้อนุมัติให้เริ่มขั้นที่ 1 (ทิศทางเทคโนโลยี D2–D4 ใน Roadmap.md ยังรอยืนยัน)

   งานที่ให้ทำ: ขั้นที่ 1 Discovery & Inventory เท่านั้น
   - ทำตาม plan.md หัวข้อ 4 และเช็กลิสต์/แม่แบบใน skill.md หัวข้อ 3 และ 4.1
   - ผลลัพธ์: docs/rea/01-inventory.md พร้อมรายการคำถามค้าง
   - repo เป็น public: ความลับให้จดแค่ว่าอยู่ไฟล์ไหน ห้ามคัดลอกค่า และห้ามนำข้อมูลลูกค้าหรือข้อมูลส่วนบุคคลเข้า repo

   เมื่อจบ
   - อัปเดต Roadmap.md (และ skill.md ถ้ามีบทเรียนใหม่) → commit → push ขึ้น branch เดิม
   - สรุปผลให้ผู้ใช้ แล้วหยุดรออนุมัติขั้นที่ 2 ก่อนทำต่อ
   ```

### ขั้นตอนวิธี A (PowerShell บน Windows)

1. ถ้าจะเก็บงานเดิมใน repo นี้ ให้เปลี่ยน repo เป็น private ก่อน: GitHub → Settings → General → Danger Zone → Change visibility
2. Clone repo แล้วคัดลอกงานเดิมเข้า `legacy/` (ไม่เอา `.git`, โฟลเดอร์ dependency/cache และไฟล์ `.env*`)

   ```powershell
   cd C:\Projects
   git clone https://github.com/ATTAKORNTH2010/NPPOOL.git NPPOOL-repo
   robocopy C:\Projects\NPPool C:\Projects\NPPOOL-repo\legacy /E /XD .git node_modules .vs .next /XF .env*
   ```

3. Stage แล้วตรวจรายการไฟล์ก่อน commit — เอารหัสผ่าน, connection string, ข้อมูลลูกค้าออก (ไฟล์ที่ไม่ควรขึ้นใช้ `git rm --cached <ไฟล์>`; ไฟล์ใหญ่เกิน 100 MB เช่น backup ฐานข้อมูล GitHub ไม่รับ ให้แจ้งแยก)

   ```powershell
   cd C:\Projects\NPPOOL-repo
   git add legacy
   git status
   ```

4. Commit และ push

   ```powershell
   git commit -m "Add legacy NPPool source for REA (read-only reference)"
   git push origin main
   ```

ถ้าฐานข้อมูลเดิมอยู่บนเซิร์ฟเวอร์ (เช่น SQL Server / MySQL) ขอเพิ่ม: ไฟล์ export **schema อย่างเดียว** + ข้อมูลตัวอย่างไม่กี่แถวที่ปิดบังข้อมูลส่วนบุคคลแล้ว

## 6. กติกาการทำงาน

1. ทำทีละขั้น หยุดรออนุมัติทุก ⏸
2. งานเดิมเป็นแบบอ่านอย่างเดียว — ไม่แก้ไข
3. ไม่เดาข้อมูลระบบเดิม — สิ่งที่ไม่แน่ใจบันทึกเป็นคำถามค้างแล้วถามผู้ใช้
4. ทุกการทำงานบันทึกใน `Roadmap.md`; วิธีการ เทคนิค และบทเรียนบันทึกใน `skill.md`
5. ไม่ commit ความลับหรือข้อมูลส่วนบุคคล (repo เป็น public)
6. พัฒนาบน branch `claude/nppool-reverse-engineering-gvbib9`; รวมเข้า `main` ผ่าน Pull Request เมื่อผู้ใช้สั่งเท่านั้น

## 7. ความเสี่ยงและการรับมือ

| ความเสี่ยง | การรับมือ |
|---|---|
| เข้าถึงงานเดิมไม่ได้ | วิธี A / B / C ในหัวข้อ 5 |
| ความลับหรือข้อมูลลูกค้ารั่วเพราะ repo เป็น public | private repo, `.gitignore`, เก็บความลับใน Environment Variables ของ Vercel |
| กฎทางธุรกิจซ่อนอยู่ในข้อมูลหรือในความรู้ของผู้ใช้ ไม่ได้อยู่ในโค้ด | ถามผู้ใช้ตามรายการคำถามค้าง + ทดสอบเทียบผลกับระบบเดิม |
| ข้อจำกัดของ serverless (ไม่มีดิสก์ถาวร, งานที่ใช้เวลานาน, งานตั้งเวลา) | Vercel Blob / Vercel Cron / แบ่งงานเป็นชิ้น ตามที่พบในขั้นที่ 1 |
| เงื่อนไขหรือราคาของ Vercel / Neon เปลี่ยน | ตรวจตอนขั้นที่ 4; Drizzle ทำให้ย้ายผู้ให้บริการ Postgres ได้ |
| ข้อมูลภาษาไทยจากระบบเก่าเข้ารหัสแบบเก่า (TIS-620 / Windows-874) หรือเก็บปีเป็น พ.ศ. | ตรวจในขั้นที่ 1 แปลงในขั้นที่ 6 (ดู skill.md) |

## 8. สิ่งที่ต้องทำ / ขออนุมัติตอนนี้ (ขั้นที่ 5)

0. **ตรวจรอบแก้ 2 บน Preview แล้ว merge (D37–D39):** Activity Logs ของผู้ใช้ที่ไม่ใช่ admin · หน้าสถานที่รับ-ส่ง (ประเภทรถ + ราคาตามราคาน้ำมัน) · โลโก้ใหม่ในหน้า login และใบพิมพ์ · ตัดสินใจว่าใบงานควรมีช่องเลือกราคาน้ำมันเพื่อเติมค่าขนส่งให้ตรงราคาหรือไม่
1. **เลือกงานถัดไปของขั้นที่ 5:** ช่อง Ref.No, CS Name, AWB No., เขต/แขวง, จังหวัด ในใบงาน · การเปลี่ยนสถานะตามลำดับ (WO-15, Q10)
2. **ข้อมูลที่ต้องเตรียม:** รายการประเภทรถจริง (Q22 / B6) ก่อน seed production
3. **แผนบริการ:** Vercel Hobby · GitHub repo สาธารณะ · Neon Free ตามที่เจ้าของยืนยัน (D35) · การแจ้ง GitHub Support ให้ลบ commit ค้างเป็นทางเลือก (B2, D36)
4. **มาตรฐานสำหรับโปรเจกต์ถัดไป:** “คู่มือมาตรฐานการพัฒนา GitHub + Vercel + Neon” (Claude Docs ของผู้ใช้ สร้าง 2026-11-28) สรุปจากโปรเจกต์นี้

ประวัติ: ขั้นที่ 0 อนุมัติ 2026-11-25 · ขั้นที่ 1 อนุมัติ 2026-11-26 (D3, D4) · ขั้นที่ 2 ยืนยัน 2026-11-26 (MVP 25 รายการ, D2, ค่าเริ่มต้นของคำถาม) · ขั้นที่ 3 อนุมัติ 2026-11-27 (D10–D18, พิมพ์แบบ A) · ขั้นที่ 4 เสร็จ 2026-11-27 (D19–D23)

ลำดับโมดูลในขั้นที่ 5: ผู้ใช้และสิทธิ์ → ข้อมูลพื้นฐาน → ใบงาน → ใบสั่งปฏิบัติงาน (พิมพ์) — อนุมัติทีละโมดูล
