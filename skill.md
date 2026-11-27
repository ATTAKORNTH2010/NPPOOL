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
| ตัวที่ deploy แล้ว (โฟลเดอร์ publish, DLL) | เทียบกับซอร์ส: ชื่อ controller/view ที่ compile อยู่ (เช่น `grep -a -o` ชื่อ type ใน DLL), วันที่ build, config ที่ใช้จริง (ดูแค่รูปแบบ ไม่ดูค่า) | รู้ว่าระบบที่ใช้งานจริงเป็นเวอร์ชันไหน |
| บันทึกการสั่งงาน / prompt ที่เคยให้ AI / chat log | อ่านตามลำดับเวลาเป็นประวัติ requirement | เจตนาของฟีเจอร์ — แยก “ตั้งใจ” ออกจาก “บั๊ก” |
| ความรู้ของผู้ใช้ | ถามตามรายการคำถามค้าง ทีละเรื่อง | กฎที่ไม่มีในโค้ด |

## 3. ขั้นตอนและเช็กลิสต์ (สอดคล้องกับ plan.md)

### ขั้นที่ 1 — Discovery & Inventory

- [ ] ระบุภาษา/เฟรมเวิร์ก/เวอร์ชันจากไฟล์ manifest (`package.json`, `*.csproj`, `composer.json`, `requirements.txt`, `pom.xml` …)
- [ ] วาดโครงสร้างไฟล์ระดับบน + นับขนาด (จำนวนไฟล์ / บรรทัด / ตาราง / แถว)
- [ ] หาวิธีรันและ config (ความลับ: จดตำแหน่ง ห้ามคัดลอกค่า)
- [ ] รายการหน้าจอ/เมนู, รายงาน, การเชื่อมต่อภายนอก, งานตั้งเวลา, ไฟล์อัปโหลด
- [ ] ตรวจ encoding ภาษาไทยและรูปแบบวันที่ (ค.ศ. / พ.ศ.)
- [ ] ทำรายการ endpoint ทั้งหมด + สิทธิ์ที่ server บังคับจริง (เมนูที่ซ่อนตามบทบาทไม่ใช่การตรวจสิทธิ์)
- [ ] เทียบซอร์สกับตัวที่ deploy อยู่ เพื่อรู้ว่าระบบที่ใช้งานจริงเป็นเวอร์ชันไหน
- [ ] สิ่งที่ต้องดึงจากฐานข้อมูลจริง (จำนวนแถว, FK, คุณภาพข้อมูล) → เตรียมสคริปต์อ่านอย่างเดียวที่ให้ผลเป็นตัวเลขสรุป ให้ผู้ใช้รันหรืออนุญาตก่อน
- [ ] เขียน `docs/rea/01-inventory.md` + คำถามค้าง

สิ่งที่มักพบในระบบงานขนส่ง/โลจิสติกส์ (ใช้เป็นเช็กลิสต์สำหรับค้นหา **ไม่ใช่ข้อสรุป**): ลูกค้า, ผู้ส่ง-ผู้รับ, ใบงาน/ใบสั่งขนส่ง, รถ, คนขับ, เส้นทาง, อัตราค่าขนส่ง, สถานะการขนส่ง, หลักฐานการส่ง (รูป/ลายเซ็น), ใบแจ้งหนี้/ใบเสร็จ

### ขั้นที่ 2 — Analysis

- [ ] Domain model + ER diagram (Mermaid ใน Markdown)
- [ ] Data dictionary ทุกตาราง/ทุก field (แม่แบบ 4.2)
- [ ] บทบาทผู้ใช้ × สิทธิ์ (role matrix)
- [ ] User flow หลัก
- [ ] กฎธุรกิจทุกข้อพร้อมหลักฐานและตัวอย่าง input → output (แม่แบบ 4.4) — เขียนพฤติกรรม “ที่โค้ดทำจริง” แยกจาก “ระบบใหม่ควรเป็น”
- [ ] Feature Parity Matrix (แม่แบบ 4.3) ให้ผู้ใช้จัดลำดับความสำคัญ
- [ ] รายการ “ความต่างที่ตั้งใจ” (ข้อบกพร่องเดิมที่ไม่ลอก) ให้ผู้ใช้อนุมัติทั้งชุด
- [ ] ค่าเริ่มต้นสำหรับคำถามค้างที่ยังไม่ได้คำตอบ เพื่อให้ขั้นถัดไปเดินต่อได้โดยไม่เดาเงียบๆ

### ขั้นที่ 3 — Target Design

- [ ] Schema Postgres ใหม่ + ตาราง mapping เดิม → ใหม่ (ใช้หัวข้อ 5.3)
- [ ] Route map / หน้าจอใหม่
- [ ] ADR สำหรับการตัดสินใจสำคัญ (แม่แบบ 4.6) — ทุกฉบับมีทางเลือกอย่างน้อย 2 ทาง และระบุสิ่งที่ต้องทดสอบจริงในขั้นที่ 4
- [ ] ตรวจเวอร์ชัน (npm) และเอกสารปัจจุบันของทุกไลบรารี/บริการที่เลือกก่อนเขียน ADR
- [ ] แบบหน้าจอตรงกับขอบเขต MVP — ฟีเจอร์ระดับ S/C ที่ปรากฏในแบบต้องติดป้าย
- [ ] ตรวจลิงก์ภายในเอกสาร และชื่อ (ฟังก์ชัน, ตาราง, คอลัมน์) ให้ตรงกันทุกเอกสาร

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

| ID | กฎ | เงื่อนไข / สูตร (ระบบเดิมทำจริง) | หลักฐาน | ตัวอย่าง input → output | ระบบใหม่ (คง / แก้ / ตัด + คำถามค้าง) |
|---|---|---|---|---|---|

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

### 5.1 เวอร์ชัน (ตรวจจาก npm เมื่อ 2026-11-26 — ตรวจซ้ำก่อน scaffold)

| แพ็กเกจ | เวอร์ชัน |
|---|---|
| next / create-next-app | 16.4.6 (Node ≥ 20.9) |
| react | 19.3.1 |
| drizzle-orm / drizzle-kit | 0.45.4 / 0.31.11 |
| pg / @vercel/functions | 8.23.1 / 3.11.4 (ADR-0003) |
| @neondatabase/serverless | 1.2.1 (ไม่ได้เลือกเป็น driver หลัก) |
| better-auth | 1.7.28 (ADR-0004) · next-auth ล่าสุดยังเป็น 4.24.15 |
| tailwindcss / shadcn (CLI) | 4.3.5 / 4.23.1 |
| react-hook-form / @hookform/resolvers | 7.92.0 / 7.0.9 |
| react-day-picker / date-fns | 10.0.2 / 4.4.0 |
| zod | 4.6.7 |
| vitest / @playwright/test | 5.1.2 / 1.65.1 |
| puppeteer-core / @sparticuz/chromium | 25.19.0 / 158.0.0 (เฉพาะถ้าเลือก ADR-0005 ทางเลือก B) |
| vercel (CLI) | 66.6.0 |
| ~~@vercel/postgres~~ | 0.10.0 — **deprecated ห้ามใช้** |

**ติดตั้งจริงในขั้นที่ 4 (2026-11-27):** next 16.4.6 · react 19.3.0 · tailwindcss 4.3.3 · shadcn 4.23.1 (preset `base-nova`) + @base-ui/react 1.9 · better-auth 1.7.28 · drizzle-orm 0.45.4 / drizzle-kit 0.31.11 · @electric-sql/pglite 0.6.0 (test) · vitest 5.1.2 + @types/node 22 · Node 24.x · GitHub Actions `actions/checkout@v7`, `actions/setup-node@v7`

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
| SQL Server | `varchar` / `char` ที่ collation `Thai_*` | `text` — ข้อมูลเดิมเป็น code page 874 ต้องแปลงเป็น UTF-8 ตอนย้าย |
| SQL Server | `varchar(max)` / `nvarchar(max)` | `text` |
| SQL Server | `date` / `time` | `date` / `time` |
| MySQL | `tinyint(1)` | `boolean` |
| MySQL | `enum(...)` | `text` + `check` หรือ Postgres enum |
| MS Access | Yes/No · Currency · AutoNumber · Long Text | `boolean` · `numeric(19,4)` · identity · `text` |
| Excel | วันที่แบบ serial number | `date` (นับวันจาก 1899-12-30) |

### 5.4 คำสั่งที่ใช้บ่อย (ยืนยันแล้วในขั้นที่ 4 — ดูทั้งหมดใน README)

```bash
npm run dev                       # รันบนเครื่อง (ต้องมี .env.local ที่ชี้ Neon branch dev)
npm run lint && npm run typecheck && npm test   # ตรวจก่อน commit (test ไม่ต้องมีฐานข้อมูล)
npm run build                     # ต้องมี BETTER_AUTH_SECRET (ค่าสมมติได้)
npm run db:generate               # สร้างไฟล์ migration จาก schema → ตรวจ SQL ใน drizzle/
npm run db:migrate                # รัน migration (ใช้ DATABASE_URL_UNPOOLED)
npm run db:seed                   # seed ข้อมูลอ้างอิง (รันซ้ำได้)
npm run admin:ensure              # สร้างผู้ดูแลคนแรกจาก ADMIN_* ถ้ายังไม่มี
npm run env:check                 # ตรวจว่ามี env ที่จำเป็น (แสดงแค่ชื่อ)
```

ไม่ใช้ `vercel env pull` กับ environment Development เพราะ integration ให้ connection ของ branch หลัก (production)

## 6. ข้อควรระวัง (Gotchas)

### Vercel / Neon

- **Vercel Postgres เลิกให้บริการแล้ว** — “ใช้ Vercel Postgres” ในปัจจุบัน = ติดตั้ง Neon จาก Vercel Marketplace; โปรเจกต์นี้ใช้ driver `pg` (ADR-0003) ไม่ใช้ `@vercel/postgres`
- Connection string: `DATABASE_URL` (pooled ใช้กับแอป) และ `DATABASE_URL_UNPOOLED` (direct ใช้รัน migration) — integration ใส่ `PG*`, `POSTGRES_*`, `NEON_PROJECT_ID` มาด้วย
- หน้าติดตั้ง Neon **เปิด Neon Auth เป็นค่าเริ่มต้น** — ปิดเมื่อใช้ Better Auth
- branch ต่อ Preview ตั้งที่การเชื่อม project: “Create database branch for deployment” → Preview (ไม่ติ๊ก Production) · ได้ branch `preview/<git branch>` สร้างจาก branch หลัก ค่า env ของ branch ใส่ตอน deploy และไม่แสดงในหน้า Environment Variables · ลบเมื่อ deployment ถูกลบ
- environment Development ของ integration ได้ connection ของ branch หลัก — อย่าติ๊ก แล้วสร้าง branch `dev` เองสำหรับเครื่องผู้พัฒนา
- ตัวแปร Sensitive อ่านย้อนไม่ได้ทั้งใน dashboard และ CLI และใช้กับ Development ไม่ได้
- Driver แบบ HTTP ของ Neon (`neon-http`) ไม่รองรับ transaction แบบ interactive · บน Vercel Fluid compute ใช้ `pg` Pool ระดับ module + `attachDatabasePool()` ของ `@vercel/functions` ตามคำแนะนำของ Vercel (ADR-0003) — ตรวจวิธีใช้กับเอกสารฉบับปัจจุบันตอนขั้นที่ 4
- Postgres `lpad()` **ตัด**ข้อความที่ยาวเกินความยาวที่กำหนด (`lpad('10000', 4, '0')` = `'1000'`) — จัดรูปแบบเลขเอกสารใน TypeScript (`padStart`)
- `user` เป็นคำสงวนของ Postgres — ตั้งชื่อตารางผู้ใช้เป็น `users`
- Serverless ไม่มีดิสก์ถาวร — ไฟล์อัปโหลด/รูปใช้ Vercel Blob; งานตั้งเวลาใช้ Vercel Cron; งานที่ใช้เวลานานต้องแบ่งเป็นชิ้น (ตรวจ limit ของแพ็กเกจ Vercel ที่ใช้)
- ตั้ง region ของฐานข้อมูลและ Functions ให้อยู่ใกล้กัน (เช่น Singapore) เพื่อลด latency
- Server บน Vercel ทำงานด้วยเวลา UTC

### Better Auth (ตรวจจากเอกสาร 2026-11-26)

- core บังคับให้ผู้ใช้มี `email` ไม่ซ้ำ — ระบบที่ login ด้วย username อย่างเดียวต้องสร้างอีเมลสมมติ (ใช้โดเมน `.invalid` ที่ส่งจริงไม่ได้)
- username plugin: `signIn.username` · ค่าเริ่มต้นใช้ได้ a–z 0–9 `_` `.` ยาว 3–30 ตัว ไม่สนตัวพิมพ์
- admin plugin: `createUser` บังคับ email, password, name · มี `setRole`, `setUserPassword`, `banUser` (ระงับแล้ว session ถูกเพิกถอน), `listUsers` · custom roles ผ่าน access control
- rate limit ค่าเริ่มต้นเก็บในหน่วยความจำ ซึ่งไม่เหมาะกับ serverless → `storage: "database"` · กฎในตัวครอบ `/sign-in/email` — เพิ่มกฎให้ `/sign-in/username` เอง
- Auth.js (NextAuth) อยู่ในความดูแลของทีม Better Auth ตั้งแต่ ก.ย. 2025 และแนะนำให้โปรเจกต์ใหม่ใช้ Better Auth
- `rememberMe: false` = cookie แบบ session ของ browser **แต่** แถว session อายุ 24 ชั่วโมงตายตัวและไม่ต่ออายุเลย — ถ้าต้องการ idle timeout ต้องเขียน hook เอง (`src/lib/auth/session-policy.ts`)
- Server Component ตั้ง cookie ไม่ได้ (plugin `nextCookies` กลืน error เงียบ ๆ) → session แบบมี Max-Age ต่ออายุได้เฉพาะผ่าน Route Handler / Server Action · DAL จึงเรียก `getSession` ด้วย `disableRefresh` และให้ client ping `/api/auth/get-session`
- `next build` ผ่านแม้ไม่มี `BETTER_AUTH_SECRET` — ไปพังตอน login (production ไม่ยอมใช้ secret ค่าเริ่มต้น) → ตรวจ env ก่อน build
- `createUser` ของ admin plugin ส่ง username ผ่าน `data: { username, displayUsername }` · CLI ของ Better Auth คือแพ็กเกจ `auth` (`npx auth@latest …`)
- rate limit ใช้ IP จาก `x-forwarded-for` **เฉพาะเมื่อมีค่าเดียว** (ถ้าไม่ตั้ง `trustedProxies`) — บน Vercel ได้ค่าเดียวจาก edge จึงใช้ได้ · ถ้าหา IP ไม่ได้ใน production จะ**ข้าม** rate limit · IPv6 ถูกรวมเป็น /64 (บนเครื่องเห็นเป็น `0000:…:0000`)

### Next.js 16 (ยืนยันแล้วตอน scaffold 16.4.6 — อ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด)

- Turbopack เป็นค่าเริ่มต้นของ `next dev` และ `next build`
- `middleware.ts` เปลี่ยนชื่อเป็น `proxy.ts`
- `params`, `searchParams`, `cookies()`, `headers()` เป็น async — ต้อง `await`
- เลิกคำสั่ง `next lint` — เรียก ESLint โดยตรง
- `create-next-app` 16.4 เปิด **Cache Components** + Partial Prefetching ให้เลย: อะไรที่อ่าน `headers()`/session ต้องอยู่ใน `<Suspense>` ไม่งั้น build ล้ม · `new Date()`, `Date.now()`, `Math.random()` ระหว่าง prerender = build error **รวมถึงใน Client Component** (เช่น `SidebarMenuSkeleton` ของ shadcn) → ใช้ค่าคงที่ หรือ `io()` จาก `next/cache` (มีตั้งแต่ 16.3)
- `forbidden()` ยังเป็น experimental → ใช้ `redirect("/forbidden")`
- `next dev` เขียนบล็อกกติกาลง `AGENTS.md` เอง — commit ไว้ เขียนกติกาโปรเจกต์นอกบล็อก

### shadcn/ui preset `base-nova` (Base UI)

- ใช้ prop `render={<Link href=… />}` แทน `asChild` · `cn` import จากแพ็กเกจ `cn`
- `DropdownMenuLabel` (= `Menu.GroupLabel`) ต้องอยู่ใน `DropdownMenuGroup` ไม่งั้น error ตอนเปิดเมนู — TypeScript ไม่จับ
- `use-mobile.ts` ที่ได้มาผิดกฎ ESLint `react-hooks/set-state-in-effect` → เขียนใหม่ด้วย `useSyncExternalStore`
- ข้อความ screen reader ของ sidebar/sheet เป็นภาษาอังกฤษ — แปลในไฟล์ component

### npm 11.21

- install script ของ dependency **ไม่ถูกรันจนกว่าจะอนุมัติ** (`npm install-scripts ls` / `approve`) — ในโปรเจกต์นี้มีแค่ postinstall ของ esbuild ซึ่งไม่จำเป็น จึงไม่อนุมัติ
- vitest 5 ต้องใช้ `@types/node` ≥ 22 (ไม่งั้น `ERESOLVE`)

### ข้อมูลภาษาไทยและธุรกิจไทย

- ระบบเก่าอาจเก็บภาษาไทยแบบ TIS-620 / Windows-874 → แปลงเป็น UTF-8 ตอนย้ายข้อมูล และตรวจว่าอ่านออกจริง
- ระบบเก่าอาจเก็บปีเป็น พ.ศ. → เก็บใหม่เป็น ค.ศ. เสมอ (พ.ศ. − 543) แล้วแสดงผลด้วย locale `th-TH` (แสดงเป็น พ.ศ. ให้อัตโนมัติ)
- เวลา: เก็บเป็น `timestamptz` (UTC) และแสดงผลด้วย `timeZone: 'Asia/Bangkok'` ทุกครั้ง
- เงิน: ใช้ `numeric` — โดยปริยาย Drizzle คืนค่าเป็น string ห้ามคำนวณด้วย float; ตรวจวิธีปัดเศษ (ต่อรายการ หรือท้ายบิล) และภาษี (VAT, หัก ณ ที่จ่าย) ให้ตรงกับระบบเดิม
- เลขที่เอกสาร (running number) ต้องกันเลขซ้ำเมื่อมีผู้ใช้พร้อมกัน — ใช้ sequence หรือ row lock ภายใน transaction
- การเรียงชื่อภาษาไทย: ทดสอบ collation ของ Postgres หรือเรียงฝั่งแอปด้วย `Intl.Collator('th')`
- ข้อมูลส่วนบุคคล (ชื่อ, เบอร์โทร, เลขบัตรประชาชน, ที่อยู่) ห้าม commit; ข้อมูลตัวอย่างต้องปิดบังก่อน

### ระบบเดิมที่เป็น ASP.NET Core + SQL Server

- ไฟล์ `appsettings_xxx.json` (ชื่อไม่ใช่รูปแบบ `appsettings.{Environment}.json`) ไม่ถูกโหลดอัตโนมัติ — config ที่ใช้จริงคือ `appsettings.json` ของเครื่องนั้น
- Razor view ถูก compile รวมใน DLL หลัก (ชื่อ type `Views_<Controller>_<Action>`) — ใช้ตรวจว่า build ไหนมีหน้าจออะไร
- Password hash ของ ASP.NET Core Identity ที่ขึ้นต้น `AQAAAA` = รูปแบบ V3 (PBKDF2, header ใน hash ระบุพารามิเตอร์) — จะย้ายผู้ใช้พร้อมรหัสเดิมต้องเขียนตัวตรวจ hash แบบเดียวกันใน Node.js มิฉะนั้นให้ผู้ใช้ตั้งรหัสใหม่
- `<fieldset disabled>` ทำให้ช่องในฟอร์มไม่ถูกส่ง — หน้าจอโหมด “ดู/แก้ไข” อาจบันทึกต่างจากที่เห็น ต้องไล่จาก controller · ช่อง value type (`int`) ที่ไม่ถูกส่งเลยได้ค่า 0 โดยไม่มี error แต่ช่องที่ส่งค่าว่าง (เช่น dropdown “-- เลือก --”) ทำให้ ModelState ไม่ผ่าน
- ถ้า view ไม่มี `asp-validation-for` / validation summary และไม่โหลดสคริปต์ validation → ผู้ใช้เจอ “บันทึกไม่ผ่านแบบเงียบ” — ถอดกฎจาก model attribute + controller ไม่ใช่จากหน้าจอ
- model C# อาจมี property ที่ตารางไม่มี (Dapper ข้ามให้เงียบๆ) — ยึดชื่อคอลัมน์จาก schema จริง ไม่ใช่จาก model
- ค่าตั้งต้นของ `UserValidator` ใน Identity: username ได้เฉพาะ a–z A–Z 0–9 `-._@+` (ภาษาไทยไม่ได้) และต้องไม่ซ้ำ

### สคริปต์สำรวจฐานข้อมูล (T-SQL)

- SELECT อย่างเดียว + `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED` เพื่อไม่ล็อกระบบที่ใช้งานอยู่ · ผลเป็นตัวเลขสรุป ไม่ดึงแถวที่มีข้อมูลส่วนบุคคล
- ห้ามใช้ subquery ใน aggregate (`SUM(CASE WHEN EXISTS (...) ...)` → error 130) — ใช้ `LEFT JOIN` แทน
- ไฟล์ `.sql` ที่มีภาษาไทยให้บันทึกเป็น UTF-8 แบบมี BOM, ใช้ `NCHAR(รหัส)` แทนอักษรไทยใน literal ที่มีผลต่อผลลัพธ์ และรันด้วย `sqlcmd -f 65001`
- ชื่อคอลัมน์ที่ไม่มีอยู่ = compile error ทั้ง batch · ตารางที่ไม่มีอยู่ = batch หยุดกลางทาง → แบ่งแต่ละส่วนเป็น batch ด้วย `GO` และตรวจ `OBJECT_ID(...) IS NOT NULL` ก่อนอ่านตารางที่อาจไม่มีในบางเวอร์ชัน
- `sqlcmd`: ค่าเริ่มต้นตัดข้อความยาวที่ 256 ตัวอักษร (นิยาม view ขาด) → ใช้ `-y 8000` · `-y 0` ไม่แสดงหัวคอลัมน์ · `-W` ใช้ร่วมกับ `-y` ไม่ได้
- ฐานข้อมูลที่ใช้ร่วมกับระบบอื่น: จำกัดทุก query ไว้ที่ schema ของงาน และไม่บันทึกชื่อหรือขนาดของ schema อื่น (อาจเป็นข้อมูลขององค์กรอื่น)

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
| 2026-11-26 | ค้นหาความลับด้วยคำสั่งที่แสดงเนื้อหาบรรทัด (เช่น grep แบบ content) จะพิมพ์ค่าความลับลง log ของเซสชัน — ใช้โหมดแสดงชื่อไฟล์/นับจำนวน หรือสคริปต์ที่บอกแค่ “รูปร่าง” ของค่า (มีคีย์อะไร ยาวเท่าไร ค่าซ้ำกันไหม) |
| 2026-11-26 | ไฟล์ `.sql` ที่วางในโฟลเดอร์งานเดิมเป็นฉบับร่างที่ไม่ตรงของจริง — ยึด export ของ `INFORMATION_SCHEMA` หรือฐานข้อมูลจริง และเทียบกับ SQL ในโค้ดทุกครั้ง |
| 2026-11-26 | บันทึก prompt ที่ผู้พัฒนาสั่ง AI (`Gemini_NPPOOL.txt`) คือประวัติ requirement ที่ดีที่สุด — อ่านก่อนตัดสินว่าพฤติกรรมไหน “ตั้งใจ” หรือ “บั๊ก” |
| 2026-11-26 | ซอร์สใหม่กว่าตัวที่ publish (build 2026-03-21 ยังไม่มีหน้าพิมพ์ PDF และหน้าสถานที่) — ตรวจชื่อ controller/view ใน DLL ก่อนสรุปว่าระบบที่ใช้งานจริงมีอะไร |
| 2026-11-26 | ไม่ใช้ credential จาก config ของงานเดิมเชื่อมต่อฐานข้อมูลเอง — เตรียมสคริปต์อ่านอย่างเดียวที่ให้ผลเป็นตัวเลขสรุป แล้วให้ผู้ใช้รันหรืออนุญาตก่อน |
| 2026-11-26 | เมนูที่ซ่อนตามบทบาทไม่ใช่การตรวจสิทธิ์ — ทำรายการ endpoint พร้อมสิทธิ์ที่ server บังคับจริงเสมอ (พบหน้าที่ไม่ตรวจ login เลย) |
| 2026-11-26 | โฟลเดอร์ clone จริงอาจไม่ตรงชื่อในแผน (ใช้ `C:\Projects\WebNPPOOL`) — ยืนยัน path จาก working directory ของเซสชันก่อนเริ่ม |
| 2026-11-26 | เขียนข้อเท็จจริงจาก model C# แทน schema จริงแล้วพลาด (คอลัมน์รถที่หัวใบงานไม่มีอยู่จริง) จนสคริปต์ SQL ล้มทั้ง batch — ทุกชื่อคอลัมน์ในเอกสารและสคริปต์ต้องตรวจกับ export / ฐานข้อมูลจริง |
| 2026-11-26 | schema ใน export ใหม่กว่าฐานข้อมูลที่ผู้ใช้มีอยู่ — เทียบคอลัมน์ทีละตารางก่อนบอกว่า “ฐานข้อมูลจริงเป็นแบบนี้” และบอกผู้ใช้ว่าเวอร์ชันไหนเป็นต้นแบบ |
| 2026-11-26 | ค่าอ้างอิงในฐานข้อมูลเดิมอาจเป็นข้อมูลตัวอย่าง (ประเภทรถเป็นรถยนต์นั่งในระบบขนส่งสินค้า) — ตรวจความสมเหตุสมผลกับธุรกิจก่อนนำไป seed |
| 2026-11-26 | ระบบเดิมที่ไม่มีข้อมูลจริง: กฎธุรกิจถอดได้จากโค้ด + requirement เท่านั้น — ติดป้ายว่ายังไม่ยืนยันด้วยข้อมูล และให้ทุกกฎมีตัวอย่าง input → output เพื่อใช้เป็น test แทนการเทียบกับระบบเดิม |
| 2026-11-26 | ตรวจสถานะปัจจุบันของไลบรารีก่อนตัดสินใจ — Auth.js ย้ายมาอยู่ในความดูแลของทีม Better Auth และ Vercel แนะนำ `attachDatabasePool` สำหรับ Fluid compute (สิ่งที่ “จำได้” อาจล้าสมัย) |
| 2026-11-26 | ค่าเริ่มต้นของคำถามที่ผู้ใช้ยืนยันอาจเปลี่ยนขอบเขต (Q19 → MD-08 เข้า MVP) — ไล่ผลกระทบกับ Parity Matrix ทันทีที่ได้รับการยืนยัน |
| 2026-11-26 | ตอนออกแบบหน้าจอ ฟีเจอร์ระดับ S (เบอร์ พขร. อัตโนมัติ) เผลอเข้าไปอยู่ในแบบ MVP — เทียบแบบกับรายการ M ทุกครั้ง และติดป้ายสิ่งที่เกินขอบเขต |
| 2026-11-26 | Mermaid บน GitHub เก่ากว่า Mermaid Live — ER diagram ที่ใช้ key พร้อมคำอธิบาย (`UK "..."`), `FK` และ `/` ในข้อความ แสดงบน Mermaid Live ได้แต่บน GitHub ขึ้น “Unable to render rich display” → ใช้ syntax พื้นฐาน (PK/UK ไม่มีคำอธิบาย) และเปิดดูบน GitHub หลัง push ทุกครั้ง |
| 2026-11-27 | `create-next-app` 16.4 เปิด Cache Components ให้เลย — ออกแบบ layout ให้ส่วนที่อ่าน session อยู่ใน `<Suspense>` ตั้งแต่แรก และอ่าน `node_modules/next/dist/docs/` แทนความจำ |
| 2026-11-27 | ไลบรารี auth “รองรับ remember me” ไม่ได้แปลว่าตรงกฎธุรกิจ — Better Auth ให้แบบไม่จดจำ 24 ชม. ไม่ต่ออายุ จึงต้องเขียน test ด้วยนาฬิกาจำลอง (`vi.useFakeTimers({ toFake: ["Date"] })`) เทียบกับ BR ทุกครั้ง |
| 2026-11-27 | PGlite รัน migration จริงของ drizzle ในหน่วยความจำได้ใน ~4 วินาที — integration test (constraint, auth, session) ไม่ต้องใช้ Docker หรือฐานข้อมูลบนคลาวด์ |
| 2026-11-27 | build ผ่าน ≠ deploy ใช้ได้: `next build` ไม่ต้องการ secret ของ auth — ให้ขั้นแรกของ build บน Vercel ตรวจ env ที่จำเป็น (แสดงแค่ชื่อ) |
| 2026-11-27 | auto mode ไม่อนุญาตให้เปิด Postgres จำลอง (pglite-socket) บนเครื่อง — ตรวจ UI ที่ไม่ต้องใช้ฐานข้อมูลด้วย dev server แล้วตรวจส่วนที่เหลือบน Preview; อย่าหาทางอ้อม |
| 2026-11-27 | แก้ไฟล์ markdown ด้วย regex แบบ script พลาดไปโดนบรรทัดคำอธิบายแทนแถวตาราง — ใช้ Edit ทีละจุด หรือดู `git diff` ทุกครั้งหลังแก้ด้วย script |
| 2026-11-27 | ผู้ใช้อาจ merge เข้า `main` เองก่อนถึงขั้นที่วางไว้ — Production จะ deploy ทันที ให้ runbook และ env ครอบคลุม Production ตั้งแต่แรก |
| 2026-11-27 | auto mode ไม่ให้ Claude กดยืนยัน deploy ขึ้น Production และไม่ให้เปิดดูค่าของ env (แม้เป็น Config) — เตรียมหน้าให้แล้วให้ผู้ใช้กดเอง |
| 2026-11-27 | list ของ Vercel ตัดชื่อ key ให้สั้น (`AD…`) จึงพลาดง่ายเมื่อแก้ key — ตรวจชื่อเต็มจาก DOM/`title` และให้ log ของ build บอกชัดว่าขาดตัวไหน |
| 2026-11-27 | สคริปต์ bootstrap ที่ล้ม build เมื่อค่าไม่ผ่านนโยบายช่วยให้พบปัญหาเร็ว และไม่ทำให้ Production ล่ม (Vercel ยังใช้ deployment ที่ผ่านล่าสุด) |
| 2026-11-27 | shadcn Sidebar เลือกกิ่ง desktop/mobile จาก `isMobile` ของ `SidebarProvider` — อย่าวาง `<Sidebar>` ไว้ใน Suspense แยกจาก provider (จอแคบจะ hydrate ไม่ตรง React #418) ให้ Suspense เฉพาะเนื้อหาที่ต้องรอ session · ทดสอบ hydration ด้วยแท็บใหม่ที่จอแคบ เพราะ reload ในแท็บเดิมอาจไม่เกิด |
| 2026-11-27 | แก้ตาราง markdown ด้วย regex แบบ script พลาด **ซ้ำครั้งที่ 2** (ไปเปลี่ยนแถว AUTH/WO แทน MD) — ห้ามใช้ script แก้ตารางเอกสาร ใช้ Edit ทีละแถวเท่านั้น และดู `git diff` ก่อน commit |
| 2026-11-27 | Zod v4: helper แบบ generic (`withId<S extends ZodObject>`) ทำให้ type ของฟิลด์หาย → ใช้ `schema.extend({...})` ตรง ๆ · ฟอร์มที่ schema มี transform: ส่งค่าดิบ (`getValues()`) ให้ Server Action แล้วให้ server parse เอง — ป้องกัน transform ซ้ำ 2 รอบ (เช่น ข้อความ → ตัวเลข) |
| 2026-11-27 | Cache Components: `usePathname()` ใน Client Component ที่อยู่นอก Suspense ใช้ได้กับ route คงที่ แต่ทำให้ build ของ route แบบ `[id]` ล้ม (pathname = ข้อมูลของ request) — ห่อ component ที่อ่าน URL ด้วย Suspense ตั้งแต่แรก (แม้มัน render `null`) |
| 2026-11-27 | react-day-picker ไม่มีปี พ.ศ. ในตัว — `locale={th}` + `formatters.formatCaption` (ปี+543) · เก็บค่าวันเป็น `YYYY-MM-DD` และแสดงจาก string ตรง ๆ เพื่อไม่ให้ time zone ของ browser เลื่อนวัน · Base UI Combobox ใช้ `items` + `itemToStringLabel` + `isItemEqualToValue` และ `ComboboxList` รับ render function |
