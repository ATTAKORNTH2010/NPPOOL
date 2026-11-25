# NPPool — แผนงาน REA (Reverse Engineering Anything)

> **สถานะ:** ฉบับร่าง v0.1 · 2026-11-25 · **⏸ รออนุมัติขั้นที่ 0**
> บันทึกการทำงาน → [Roadmap.md](Roadmap.md) · วิธีการ แม่แบบ และความรู้ → [skill.md](skill.md)

---

## 1. เป้าหมาย

ถอดแบบระบบ NPPool เดิมที่ `C:\Projects\NPPool` แล้วสร้างใหม่เป็นเว็บแอปที่

1. พัฒนาด้วย **Next.js** และ deploy บน **Vercel**
2. ใช้ฐานข้อมูล **Postgres บน Vercel** (อ่านหมายเหตุในหัวข้อ 3.1)

หลักการ: ทำให้ **ฟีเจอร์และกฎทางธุรกิจเทียบเท่าระบบเดิม (feature parity)** ก่อน แล้วจึงปรับปรุงเพิ่มเติม

## 2. สิ่งที่รู้แล้ว / ยังไม่รู้ (ณ 2026-11-25)

| หัวข้อ | สถานะ |
|---|---|
| GitHub repo `ATTAKORNTH2010/NPPOOL` | มีเพียง `README.md` (“Logistic app”) 1 commit — ยังไม่มีโค้ดของงานเดิม |
| การมองเห็น repo | **public** → ห้าม commit รหัสผ่าน, API key, connection string หรือข้อมูลลูกค้า |
| งานเดิม `C:\Projects\NPPool` | ⛔ ยังเข้าถึงไม่ได้ — อยู่บนเครื่อง Windows ของผู้ใช้ และยังไม่ได้แชร์ให้เซสชันคลาวด์ (ดูหัวข้อ 5) |
| ภาษา/เฟรมเวิร์กเดิม, ฟีเจอร์, ฐานข้อมูล, ผู้ใช้และสิทธิ์ | ❓ ยังไม่ทราบ — ได้จากขั้นที่ 1 (จะไม่เดาล่วงหน้า) |

## 3. ทิศทางเทคโนโลยีที่เสนอ (ตรวจเวอร์ชันจาก npm เมื่อ 2026-11-25)

| ส่วน | ที่เสนอ | เหตุผล / หมายเหตุ |
|---|---|---|
| Framework | **Next.js 16** (App Router, ล่าสุด 16.4.6) + React 19 + TypeScript | ตามโจทย์ และเป็นเฟรมเวิร์กที่ Vercel รองรับดีที่สุด |
| Runtime | Node.js ≥ 20.9 (ใช้เวอร์ชัน LTS ที่ Vercel รองรับ — ยืนยันในขั้นที่ 4) | ข้อกำหนดขั้นต่ำของ Next.js 16 |
| Database | **Postgres ผ่าน Vercel Marketplace → Neon** | Vercel Postgres เดิมเลิกให้บริการแล้ว (หัวข้อ 3.1) |
| DB driver | `@neondatabase/serverless` | ใช้แทน `@vercel/postgres` ที่ถูก deprecate |
| ORM / Migration | **Drizzle ORM + drizzle-kit** | type-safe, เบา, เหมาะกับ serverless, migration เป็นไฟล์ SQL อ่านตรวจง่าย |
| Validation | Zod | ตรวจข้อมูลเข้าที่ Server Action / API ทุกจุด |
| UI | Tailwind CSS v4 (+ shadcn/ui ถ้าเหมาะ) | ยืนยันในขั้นที่ 3 หลังเห็น UI เดิม |
| Auth | ยังไม่เลือก — ตัวเลือก: Auth.js, Better Auth, Clerk | ขึ้นกับระบบผู้ใช้/สิทธิ์ของงานเดิม → ตัดสินใจขั้นที่ 3 |
| Test | Vitest (unit) + Playwright (E2E / เทียบผลกับระบบเดิม) | |
| CI/CD | GitHub Actions (lint, typecheck, test, build) + Vercel Git Integration | Preview ทุก branch, Production จาก `main` |
| Region | ฐานข้อมูลและ Functions อยู่ Singapore (ใกล้ผู้ใช้ในไทย) | ยืนยันในขั้นที่ 4 |

### 3.1 หมายเหตุสำคัญเรื่อง “Vercel Postgres”

- ผลิตภัณฑ์ **Vercel Postgres เดิมเลิกให้บริการแล้ว** — ฐานข้อมูลเดิมถูกย้ายไป Neon ตั้งแต่ ธ.ค. 2024 และแพ็กเกจ `@vercel/postgres` ถูก deprecate (npm แจ้งไว้ชัดเจน)
- วิธีปัจจุบันในการมี Postgres บน Vercel: Vercel Dashboard → Storage / Marketplace → **Neon** → ผูกกับโปรเจกต์ → Vercel ใส่ connection string เป็น Environment Variables ให้อัตโนมัติ, คิดเงินผ่านบิล Vercel, เปิดดูตาราง/รัน SQL จาก Dashboard ได้ (เอกสาร Neon ฉบับปัจจุบันเรียกฐานข้อมูลนี้ว่า “Lakebase Postgres”)
- ตอนติดตั้งมี 2 แบบ: *Create New Neon Account* (Vercel จัดการบัญชีและบิลให้) หรือ *Link Existing Neon Account* — ความสามารถสร้าง database branch อัตโนมัติให้ Preview deployment ต่างกันระหว่างสองแบบ จะตรวจและเสนออีกครั้งในขั้นที่ 4
- ทางเลือกอื่นใน Marketplace มีเช่น Supabase, Prisma Postgres, AWS Aurora Postgres — เสนอ Neon เพราะเป็นผู้ให้บริการที่รับช่วง Vercel Postgres เดิมโดยตรง
- **จึงเสนอให้ใช้ Neon ผ่าน Vercel Marketplace ในฐานะ “Vercel Postgres” ฉบับปัจจุบัน** ← ต้องการอนุมัติ

อ้างอิง: [Vercel Docs — Postgres](https://vercel.com/docs/postgres) · [Neon บน Vercel Marketplace](https://vercel.com/marketplace/neon) · [Neon — Vercel native integration](https://neon.com/docs/guides/vercel-native-integration) · [Neon — Vercel Postgres transition guide](https://neon.com/docs/guides/vercel-postgres-transition-guide)

## 4. แผนงานทีละขั้น

ทุกขั้นจบด้วย **⏸ จุดอนุมัติ** — จะไม่เริ่มขั้นถัดไปจนกว่าผู้ใช้อนุมัติ

### ขั้นที่ 0 — เตรียมการและเข้าถึงงานเดิม ← *อยู่ที่ขั้นนี้*

- [x] สำรวจ repo และตรวจเวอร์ชันเทคโนโลยีปัจจุบัน
- [x] ร่าง `plan.md`, `Roadmap.md`, `skill.md`
- [ ] ผู้ใช้อนุมัติโครงแผนและทิศทางเทคโนโลยี (หัวข้อ 3)
- [ ] ได้สิทธิ์เข้าถึงงานเดิม (เลือกวิธีในหัวข้อ 5)

**ผลลัพธ์:** เอกสาร 3 ไฟล์ + เข้าถึงงานเดิมได้ · **⏸ อนุมัติแผน → เริ่มขั้นที่ 1**

### ขั้นที่ 1 — สำรวจและทำบัญชีรายการ (Discovery & Inventory)

อ่านอย่างเดียว ไม่แก้ไขงานเดิม

- โครงสร้างไฟล์, ภาษา/เฟรมเวิร์ก/เวอร์ชัน, dependencies, วิธีรันงานเดิม
- แหล่งข้อมูล: ฐานข้อมูล / ไฟล์ Excel / ไฟล์อื่น — schema, ความสัมพันธ์, ปริมาณข้อมูล
- หน้าจอและเมนู, รายงาน/เอกสารที่พิมพ์ออก, การเชื่อมต่อภายนอก, งานตั้งเวลา, ไฟล์อัปโหลด
- ความลับใน config (จดว่า “อยู่ที่ไหน” เท่านั้น ไม่คัดลอกค่า)
- รวบรวมคำถามค้าง (Open Questions)

**ผลลัพธ์:** `docs/rea/01-inventory.md` · **⏸ อนุมัติ → ขั้นที่ 2**

### ขั้นที่ 2 — ถอดแบบระบบเดิม (Analysis)

- Domain model / ER diagram + Data dictionary
- ผู้ใช้ บทบาท และสิทธิ์
- User flow / use case หลัก
- กฎทางธุรกิจและสูตรคำนวณ พร้อมอ้างอิงตำแหน่งในระบบเดิม
- **Feature Parity Matrix** — ฟีเจอร์ทั้งหมด + ระดับความสำคัญ (Must / Should / Could / Drop)

**ผลลัพธ์:** `docs/rea/02-domain-model.md`, `03-feature-parity.md`, `04-business-rules.md` · **⏸ ผู้ใช้ยืนยันว่าถอดแบบถูกต้อง + เลือกขอบเขต MVP**

### ขั้นที่ 3 — ออกแบบระบบใหม่ (Target Design)

- สถาปัตยกรรม, โครงสร้างโฟลเดอร์, แผนผังหน้าจอ (route map)
- Postgres schema ใหม่ + ตาราง mapping ข้อมูลเดิม → ใหม่
- เลือก Auth, UI kit, ที่เก็บไฟล์ (Vercel Blob ถ้าจำเป็น), งานตั้งเวลา (Vercel Cron ถ้าจำเป็น)
- กลยุทธ์ย้ายข้อมูล
- บันทึกการตัดสินใจเป็น ADR

**ผลลัพธ์:** `docs/design/*`, `docs/adr/*` · **⏸ อนุมัติแบบ**

### ขั้นที่ 4 — วางรากฐานโปรเจกต์ (Foundation)

- Scaffold Next.js 16 + TypeScript + Tailwind + ESLint
- Drizzle + Neon: schema เริ่มต้น, migration, seed
- `.env.example` และ `.gitignore` กันความลับหลุด (repo เป็น public)
- GitHub Actions CI
- ผู้ใช้สร้าง/เชื่อม Vercel project และติดตั้ง Neon จาก Marketplace ในบัญชีของตัวเอง (จะเตรียมขั้นตอนให้ทีละคลิก) → Preview deployment แรก
- Layout หลัก + ระบบ login

**ผลลัพธ์:** แอปตั้งต้นที่ deploy บน Vercel และต่อฐานข้อมูลได้ · **⏸ อนุมัติ**

### ขั้นที่ 5 — สร้างฟีเจอร์ตาม Parity Matrix (Rebuild) — ทีละโมดูล

- ต่อโมดูล: schema → migration → server logic → UI → test → เทียบกับระบบเดิม → อัปเดต matrix
- ลำดับทั่วไป: ข้อมูลหลัก (master data) → ธุรกรรม → รายงาน → การเชื่อมต่อภายนอก (ยืนยันลำดับจริงในขั้นที่ 2)

**ผลลัพธ์:** โมดูลที่ผ่านการทดสอบบน Preview · **⏸ อนุมัติทีละโมดูล**

### ขั้นที่ 6 — ย้ายข้อมูล (Data Migration) — ถ้างานเดิมมีข้อมูลจริง

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
| C. ทำงานต่อในเซสชันบนเครื่องของผู้ใช้ | เปิด Claude desktop app บนเครื่องนั้นแล้วทำงานในโฟลเดอร์งาน | ใช้แผนและเอกสารชุดนี้ต่อได้ทันที |

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

## 8. สิ่งที่ขออนุมัติตอนนี้ (ขั้นที่ 0)

1. **โครงแผน 9 ขั้น** (ขั้นที่ 0–8) พร้อมจุดอนุมัติทุกขั้น
2. **ทิศทางเทคโนโลยี** ในหัวข้อ 3 — โดยเฉพาะการใช้ **Neon ผ่าน Vercel Marketplace** แทน Vercel Postgres ที่เลิกให้บริการแล้ว และ Drizzle ORM
3. **วิธีเข้าถึงงานเดิม** A / B / C (หัวข้อ 5)

เมื่ออนุมัติและเข้าถึงงานเดิมได้ จะเริ่ม **ขั้นที่ 1** แล้วกลับมาขออนุมัติก่อนขึ้นขั้นที่ 2
