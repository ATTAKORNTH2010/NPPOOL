# NPPool — Roadmap และบันทึกการทำงาน

แผนเต็ม → [plan.md](plan.md) · วิธีการและความรู้ → [skill.md](skill.md)
อัปเดตล่าสุด: 2026-11-27

## สถานะภาพรวม

| ขั้น | งาน | สถานะ | อนุมัติ |
|---|---|---|---|
| 0 | เตรียมการและเข้าถึงงานเดิม | ✅ เสร็จ — เลือกวิธี C (ทำงานในเซสชันบนเครื่องผู้ใช้) | ✅ ให้ดำเนินการต่อ (2026-11-25) |
| 1 | สำรวจและทำบัญชีรายการ (Discovery & Inventory) | ✅ เสร็จ — [docs/rea/01-inventory.md](docs/rea/01-inventory.md) + คำถามค้าง 28 ข้อ (ตอบแล้ว 3) + ผลฐานข้อมูลจริง | ✅ อนุมัติ (2026-11-26) |
| 2 | ถอดแบบระบบเดิม (Analysis) | ✅ เสร็จ — [02-domain-model](docs/rea/02-domain-model.md) · [03-feature-parity](docs/rea/03-feature-parity.md) · [04-business-rules](docs/rea/04-business-rules.md) | ✅ ยืนยันการถอดแบบ + MVP 25 รายการ (2026-11-26) |
| 3 | ออกแบบระบบใหม่ (Target Design) | ✅ เสร็จ — [docs/design](docs/design/01-architecture.md) (3 ไฟล์) + [ADR 11 ฉบับ](docs/adr/README.md) | ✅ อนุมัติแบบ + เลือกวิธีพิมพ์ A (2026-11-27) |
| 4 | วางรากฐานโปรเจกต์ (Foundation) | ✅ เสร็จ — Production ที่ `webnppool.vercel.app` (Neon Singapore) · login ด้วยบัญชีผู้ดูแลได้ | ✅ ผู้ใช้ให้เริ่มขั้นที่ 5 (2026-11-27) |
| 5 | สร้างฟีเจอร์ตาม Parity Matrix (Rebuild) | 🟨 โมดูล 1 ✅ · โมดูล 2 ข้อมูลพื้นฐาน กำลังทำ | ⏸ อนุมัติทีละโมดูล |
| 6 | ย้ายข้อมูล (Data Migration) | ⬜ | — |
| 7 | ทดสอบเทียบระบบเดิมและ UAT | ⬜ | — |
| 8 | ขึ้นระบบจริงและส่งมอบ | ⬜ | — |

สัญลักษณ์: ⬜ ยังไม่เริ่ม · 🟨 กำลังทำ · ⏸ รออนุมัติ · ✅ เสร็จ/อนุมัติแล้ว · ⛔ ติดปัญหา

## Blockers

| # | เรื่อง | ต้องการ | สถานะ |
|---|---|---|---|
| B1 | เซสชันคลาวด์เข้าถึง `C:\Projects\NPPool` ไม่ได้ | ผู้ใช้เลือกวิธี C: ทำขั้นที่ 1 ในเซสชันบนเครื่องผู้ใช้ (plan.md หัวข้อ 5) | ✅ ปิด (2026-11-25) |
| B2 | Repo เป็น public — เสี่ยงความลับ/ข้อมูลลูกค้าหลุด | วิธี C ไม่ต้อง push งานเดิม; ยังต้องระวังไม่ให้ค่าความลับหรือข้อมูลส่วนบุคคลหลุดเข้าเอกสาร/โค้ด | 🟨 ลดความเสี่ยงแล้ว — ใช้กติกา plan.md หัวข้อ 6 · ตรวจเอกสารขั้นที่ 1 แล้ว ไม่มีค่าความลับ ชื่อเครื่อง หรือชื่อลูกค้า |
| B3 | ยังไม่รู้จำนวนแถว, PK/FK และคุณภาพข้อมูลจริง (ไฟล์ export มีแค่คอลัมน์และ view) | ผู้ใช้อนุญาตให้เซสชันรันสคริปต์ด้วย Windows authentication (Q3) | ✅ ปิด (2026-11-26) — รันแล้ว ผลใน 01-inventory หัวข้อ 8.0 |
| B4 | ไม่รู้ว่าระบบที่ใช้งานจริงเป็นเวอร์ชันไหน อยู่เครื่องไหน | ผู้ใช้ตอบ Q1–Q2 | ✅ ปิด (2026-11-26) — ไม่ได้เปิดใช้งานแล้ว ใช้ซอร์สล่าสุดเป็นต้นแบบ |
| B5 | schema ฉบับใหม่ (มี `Location_From_To`) ไม่มีในฐานข้อมูลบนเครื่องนี้ — มีแค่ใน export | ใช้ export + โค้ดเป็นต้นแบบ schema | 🟨 ไม่บล็อก — ระวังตอนทดสอบเทียบกับระบบเดิม (03 หัวข้อ 6) |
| B6 | ยังไม่มีรายการประเภทรถจริง (ค่าในฐานข้อมูลเดิมเป็นรถยนต์นั่ง — Q22) | ผู้ใช้ส่งรายการประเภทรถที่ใช้จริง | 🟨 ไม่บล็อกขั้นที่ 3–4 · ต้องได้ก่อน seed production |
| B7 | ขั้นที่ 4 ต้องมีบัญชี Vercel ที่ผูกกับ repo และติดตั้ง Neon จาก Marketplace | ผู้ใช้ทำตาม [runbook 01](docs/runbook/01-vercel-neon-setup.md) ในบัญชีของตัวเอง แล้วแจ้ง Claude | ✅ ปิด (2026-11-27) — ตั้งค่าร่วมกันใน browser pane · Production ใช้งานได้ |
| B9 | Preview ยังไม่มี `BETTER_AUTH_SECRET` — build ของ branch งานล้มที่ `env:check` | ผู้ใช้เพิ่ม `BETTER_AUTH_SECRET` ให้ Preview (ค่าใหม่ ไม่ซ้ำ Production) | ✅ ปิด (2026-11-27) — Preview build ผ่าน |
| B8 | โลโก้ NP Pool จริง — กติกาห้ามคัดลอกไฟล์จากงานเดิมเข้า repo | ผู้ใช้ส่งไฟล์โลโก้ หรืออนุญาตให้คัดลอกไฟล์โลโก้จาก `C:\Projects\NPPool` | 🟨 ไม่บล็อก — ระหว่างนี้ใช้ตราตัวอักษร + ไอคอนรถบรรทุก |

## Decision log

| ID | การตัดสินใจ | สถานะ | วันที่ |
|---|---|---|---|
| D1 | โครงแผน 9 ขั้น (0–8) มีจุดอนุมัติทุกขั้น | ✅ ผู้ใช้ให้ดำเนินการต่อ | 2026-11-25 |
| D2 | Next.js 16 (App Router) + TypeScript บน Vercel | ✅ ยืนยันพร้อมรายการใน 03 หัวข้อ 7 (ADR-0001) | 2026-11-26 |
| D3 | Postgres = Neon ผ่าน Vercel Marketplace (Vercel Postgres เดิมเลิกให้บริการ) | ✅ ผู้ใช้อนุมัติ | 2026-11-26 |
| D4 | ORM / migration = Drizzle ORM + drizzle-kit | ✅ ผู้ใช้อนุมัติ | 2026-11-26 |
| D5 | ต้นแบบ = ซอร์สล่าสุด (2026-06-28) รวมหน้าพิมพ์ PDF และหน้าสถานที่รับ-ส่ง (ระบบเดิมไม่ได้เปิดใช้งานแล้ว) | ✅ ผู้ใช้กำหนด (Q1) | 2026-11-26 |
| D6 | ไม่ลอกข้อบกพร่องของระบบเดิม — ใช้รายการ “ความต่างที่ตั้งใจ” ใน 03 หัวข้อ 3 | ✅ ผู้ใช้ยืนยัน | 2026-11-26 |
| D7 | ขอบเขต MVP = ฟีเจอร์ระดับ M (03 หัวข้อ 5) — 25 รายการ หลังค่าเริ่มต้น Q19 ย้าย MD-08 เข้ามา | ✅ ผู้ใช้ยืนยัน | 2026-11-26 |
| D8 | ไม่ย้ายข้อมูลธุรกรรม (ฐานข้อมูลไม่มีใบงาน) — ขั้นที่ 6 เหลือ seed ข้อมูลอ้างอิง | ✅ ยืนยันผ่าน GEN-06 Drop (ADR-0011) | 2026-11-26 |
| D9 | คำถามที่ยังไม่ตอบใช้ค่าเริ่มต้นใน 03 หัวข้อ 7 (Q5, Q6, Q9–Q11, Q14, Q15, Q17, Q19, Q26) | ✅ ผู้ใช้ยืนยัน | 2026-11-26 |
| D10 | DB driver = `pg` Pool + `attachDatabasePool` บน Vercel Fluid | ✅ อนุมัติ ([ADR-0003](docs/adr/0003-drizzle-and-db-connection.md)) | 2026-11-27 |
| D11 | Auth = Better Auth (username + admin plugin, session และ rate limit ในฐานข้อมูล) | ✅ อนุมัติ ([ADR-0004](docs/adr/0004-auth-better-auth.md)) | 2026-11-27 |
| D12 | ใบสั่งปฏิบัติงาน = หน้า HTML สำหรับพิมพ์ (A) หรือ PDF จาก server (B) | ✅ ผู้ใช้เลือก A ([ADR-0005](docs/adr/0005-job-order-printing.md)) | 2026-11-27 |
| D13 | UI = Tailwind + shadcn/ui + Noto Sans Thai / Sarabun + แบรนด์ NP Pool | ✅ อนุมัติ ([ADR-0006](docs/adr/0006-ui-kit-and-thai-fonts.md)) | 2026-11-27 |
| D14 | เลขที่ใบงานด้วยตารางตัวนับต่อเดือน + unique + เวลาไทย | ✅ อนุมัติ ([ADR-0007](docs/adr/0007-work-order-numbering.md)) | 2026-11-27 |
| D15 | เวลาเก็บ `timestamptz` แสดง Asia/Bangkok ปี พ.ศ. | ✅ อนุมัติ ([ADR-0008](docs/adr/0008-dates-timezone-buddhist-year.md)) | 2026-11-27 |
| D16 | สิทธิ์ deny by default ตรวจทุก page และ Server Action | ✅ อนุมัติ ([ADR-0009](docs/adr/0009-authorization-deny-by-default.md)) | 2026-11-27 |
| D17 | ไม่ลบถาวร: ยกเลิกใบงาน / ปิดใช้งานข้อมูลพื้นฐาน + FK | ✅ อนุมัติ ([ADR-0010](docs/adr/0010-no-hard-delete.md)) | 2026-11-27 |
| D18 | Migration รันใน build ของ Vercel + seed แบบรันซ้ำได้ | ✅ อนุมัติ ([ADR-0011](docs/adr/0011-migrations-and-seed-data.md)) | 2026-11-27 |
| D19 | เปิด Cache Components + Partial Prefetching ไว้ (ค่าเริ่มต้นของ Next.js 16.4 และจะบังคับในรุ่นหลักถัดไป) — ส่วนที่อ่าน session อยู่ใน `<Suspense>` | ✅ อนุมัติ (ให้เริ่มขั้นที่ 5) | 2026-11-27 |
| D20 | session 30 นาทีแบบต่ออายุทั้งแบบจดจำ/ไม่จดจำ: hook ใน `session-policy.ts` + `SessionKeepAlive` (ไลบรารีให้แบบไม่จดจำ 24 ชม. ไม่ต่ออายุ — ไม่ตรง BR-AU-03) | ✅ อนุมัติ ([ADR-0004](docs/adr/0004-auth-better-auth.md) ผลตรวจ) | 2026-11-27 |
| D21 | Neon: branch แยกต่อ Preview (`Create database branch for deployment: Preview`) · ไม่เชื่อม Development (กันใช้ฐานข้อมูล production บนเครื่อง) · ปิด Neon Auth | ✅ อนุมัติ ([runbook 01](docs/runbook/01-vercel-neon-setup.md)) | 2026-11-27 |
| D22 | ผู้ดูแลคนแรกสร้างจาก `ADMIN_*` ใน build (`admin:ensure`) · `env:check` เป็นขั้นแรกของ build | ✅ อนุมัติ | 2026-11-27 |
| D23 | Node.js 24.x (`engines`) ทั้ง Vercel และ CI | ✅ อนุมัติ | 2026-11-27 |
| D24 | ดึงหน้าจัดการประเภทรถ (MD-05) เข้าโมดูล 2 — หน้ารถใช้งานไม่ได้ถ้าไม่มีประเภทรถ และรายการจริง (Q22) ยังไม่มา ผู้ดูแลเพิ่มเองได้ | ⏸ เสนอ (ขั้นที่ 5 โมดูล 2) | 2026-11-27 |

## ประวัติการอนุมัติ

| วันที่ | ขั้น | ผล | หมายเหตุ |
|---|---|---|---|
| 2026-11-27 | 5 · โมดูล 1 | ผู้ใช้ “อนุมัติ ไปโมดูล 2” — อนุมัติโมดูล 1 ผู้ใช้และสิทธิ์ (ทดสอบบน Preview) | fix sidebar hydration อยู่บน branch รอ merge |
| 2026-11-27 | 4 → 5 | ผู้ใช้ “หา user/pass admin ได้ครบหมด เริ่มพัฒนาหน้าอื่น ๆ ตามแผนต่อได้เลย” — login Production ได้ · ถือว่าอนุมัติจบขั้นที่ 4 และ D19–D23 | ผู้ใช้ merge PR #2 เข้า `main` เอง จึงขึ้น Production ก่อน Preview |
| 2026-11-27 | 3 → 4 | ผู้ใช้ “อนุมัติ ใช้แบบ A” — อนุมัติแบบระบบและ ADR ที่เสนอทั้งหมด (D10–D18) · เลือกพิมพ์ใบสั่งปฏิบัติงานด้วยหน้า HTML | — |
| 2026-11-26 | 2 → 3 | ผู้ใช้ “ยืนยัน เริ่มขั้นที่ 3” — ยืนยันการถอดแบบ, ความสำคัญ M/S/C/Drop, MVP, ความต่างที่ตั้งใจ, ค่าเริ่มต้นของคำถามที่ยังไม่ตอบ และ D2 | ผลจากค่าเริ่มต้น Q19: MD-08 เข้า MVP (25 รายการ) |
| 2026-11-26 | 1 → 2 | ผู้ใช้อนุมัติเริ่มขั้นที่ 2 · อนุมัติ D3 (Neon) และ D4 (Drizzle) · ตอบ Q1–Q3 | อนุญาตให้เซสชันรันสคริปต์ SELECT ด้วย Windows authentication · D2 ยังรอยืนยัน |
| 2026-11-25 | 0 → 1 | ผู้ใช้แจ้งเปิด Remote Control และให้ดำเนินงานต่อ | D2–D4 ยังรอยืนยัน |
| 2026-11-25 | 0 | ผู้ใช้เลือกวิธี C — ทำงานต่อในเซสชันบนเครื่องผู้ใช้ | ข้อความส่งต่องานอยู่ใน plan.md หัวข้อ 5 |

## บันทึกการทำงาน (ใหม่อยู่บน)

### 2026-11-27 · เซสชันที่ 2 (ต่อ) · ขั้นที่ 5 — โมดูล 2 ข้อมูลพื้นฐาน

**ทำแล้ว**

- 5 หน้า (Admin เท่านั้น) รูปแบบเดียวกันตาม design 02 หัวข้อ 3.6: ค้นหา · ☐ แสดงที่ปิดใช้งาน · แบ่งหน้า 20 แถว · เพิ่ม/แก้ไขในกล่อง dialog · เมนูแถว: แก้ไข · ปิดใช้งาน/เปิดใช้งาน · ลบ (ลบได้เฉพาะรายการที่ไม่มีข้อมูลอื่นใช้ — ฐานข้อมูลกันไว้ด้วย FK แล้วแนะนำให้ปิดใช้งานแทน, MD-08)
  - **ผู้ว่าจ้าง** (MD-01): บังคับ 4 ช่องด้วยข้อความเดิมของระบบเก่า · เลขผู้เสียภาษี 13 หลัก (พิมพ์ขีดได้ เก็บเป็นตัวเลข แสดง `0-1055-12345-67-8`)
  - **รถ** (MD-02): ทะเบียนไม่ซ้ำ (ตัดช่องว่างซ้ำก่อนเทียบ) · เลือกได้เฉพาะประเภทรถที่ใช้งานอยู่ (รถเดิมคงประเภทที่ถูกปิดภายหลังได้)
  - **ประเภทรถ** (MD-05 ดึงเข้ามา — D24 รออนุมัติ): รหัสไม่ซ้ำ (ตัวพิมพ์ใหญ่) · ชื่อ · ลำดับการแสดง
  - **พนักงานขับรถ** (MD-03): ชื่อ, นามสกุล บังคับ · เบอร์ไม่บังคับ
  - **สถานที่รับ-ส่ง** (MD-04): ราคา ≥ 0 ทศนิยม 2 ตำแหน่ง (พิมพ์จุลภาคได้) แสดง `#,##0.00` · ช่องสถานที่แนะนำชื่อที่มีอยู่ · เรียงใหม่→เก่า
- เรียงชื่อภาษาไทยด้วย `Intl.Collator("th")` (BR-MD-06) · บันทึกผู้สร้าง/ผู้แก้ทุกครั้ง
- ส่วนกลางที่ใช้ซ้ำ: `runAction` (ตรวจสิทธิ์ → validate → ทำงาน → `refresh()` — โมดูลผู้ใช้ย้ายมาใช้ด้วย) · `MasterDataTable` · `EntityFormDialog` · `TextField` · แปลง error ของ Postgres (ซ้ำ / ถูกอ้างอิง) เป็นข้อความไทย
- Test เพิ่ม 20 รายการ (รวม 96): กฎทุกหน้า + ลบรายการที่ใบงานใช้อยู่ไม่ได้ บน PGlite

**ตรวจ**

- lint, typecheck, test, build ผ่าน · ยังไม่ได้ลองบน Preview กับฐานข้อมูลจริง

**ถัดไป**

- ⏸ ผู้ใช้ลองบน Preview และอนุมัติโมดูล 2 + D24 → โมดูล 3 ใบงาน (ต้องมีประเภทรถจริงอย่างน้อย 1 ประเภท)

### 2026-11-27 · เซสชันที่ 2 (ต่อ) · ขั้นที่ 5 — โมดูล 1 ผู้ใช้และสิทธิ์

**ทำแล้ว**

- หน้า `/admin/users` (AUTH-06, design 02 หัวข้อ 3.7): รายการ (ชื่อผู้ใช้, ชื่อ-นามสกุล, เบอร์, บทบาท, สถานะ) · เพิ่มผู้ใช้ · เปลี่ยนบทบาท · ตั้งรหัสผ่านใหม่ (ผู้ใช้ถูกออกจากระบบทุกเครื่อง) · ระงับ / เลิกระงับ (ยืนยันด้วย AlertDialog)
- กันพลาด: ระงับหรือลดบทบาท Admin ที่ใช้งานได้คนสุดท้ายไม่ได้ · ระงับตัวเองไม่ได้
- โครง: `src/features/users/` = `schemas.ts` (Zod ใช้ร่วมฟอร์มกับ server) · `service.ts` (กฎ — ไม่ผูก Next.js จึง test บน PGlite ได้) · `actions.ts` (Server Actions: ตรวจสิทธิ์ → validate → ทำงาน → `refresh()`) · `components/` · Better Auth admin plugin ตรวจสิทธิ์อีกชั้น
- Test เพิ่ม 9 integration + 3 unit (รวม 76)

**ตรวจ**

- lint, typecheck, test, build ผ่าน · CI บน GitHub ผ่าน
- ผู้ใช้เพิ่ม `BETTER_AUTH_SECRET` ของ Preview (B9 ปิด) → Preview ของ branch งาน build ผ่าน · ฐานข้อมูล Preview คัดลอกจาก Production หลังสร้าง `admin` จึงใช้บัญชีเดียวกันได้
- ผู้ใช้ merge PR #3 เข้า `main` เอง → Production มีโมดูล 1 แล้ว
- ตรวจบน Preview (ผู้ใช้ login เอง Claude ไม่กดบันทึกใด ๆ): รายการผู้ใช้ · ฟอร์มเพิ่มผู้ใช้ + ข้อความตรวจภาษาไทย · เมนู “ระงับบัญชี” ของตัวเองถูกปิด · หน้าต่างเปลี่ยนบทบาท (ปุ่มบันทึกปิดจนกว่าจะเปลี่ยน) · หน้าต่างยืนยันระงับ → ยกเลิก

**พบและแก้**

- React error #418 (hydration ไม่ตรง) ทุกหน้าในส่วนที่ต้อง login เมื่อจอแคบกว่า 768px — sidebar อยู่ใน Suspense แยกจาก `SidebarProvider` จึง hydrate หลัง `isMobile` เปลี่ยนแล้ว (เกิดตั้งแต่ขั้นที่ 4) → ย้ายกรอบ sidebar ออกนอก Suspense เหลือแค่รายการเมนูที่ต้องรู้บทบาท (`ff55a7b`) · ตรวจซ้ำ: เปิดแท็บใหม่ 3 หน้าที่จอแคบ ไม่มี error (ก่อนแก้เกิด 3 จาก 3) · fix นี้ยังอยู่บน branch — ต้อง merge เข้า `main` เพื่อขึ้น Production

**ถัดไป**

- ⏸ ผู้ใช้ลองบันทึกจริงบน Preview (เพิ่มผู้ใช้, ตั้งรหัสผ่านใหม่, ระงับ/เลิกระงับ) แล้วอนุมัติโมดูล 1 → โมดูล 2 ข้อมูลพื้นฐาน (ผู้ว่าจ้าง, รถ, พนักงานขับรถ, สถานที่รับ-ส่ง)

### 2026-11-27 · เซสชันที่ 2 (ต่อ) · ขั้นที่ 4 — ตั้งค่า Vercel + Neon และ deploy แรก

**ทำแล้ว**

- ผู้ใช้ merge PR #2 เข้า `main` → Vercel build Production แล้วหยุดที่ `env:check` (ยังไม่มีฐานข้อมูล) ตามที่ออกแบบ
- ตั้งค่าร่วมกันใน browser pane (ผู้ใช้ login และใส่ค่าความลับเอง): ติดตั้ง Neon `nppool-db` (Singapore, Free, ปิด Neon Auth) → เชื่อม `webnppool` สำหรับ Production + Preview พร้อม branch ต่อ Preview → `ADMIN_USERNAME`, `ADMIN_NAME` (Production + Preview) → ผู้ใช้ใส่ `BETTER_AUTH_SECRET`, `ADMIN_PASSWORD` (Production)
- Redeploy Production ผ่าน (migrate + seed + build) → ครั้งต่อมาล้มเพราะ key `ADMIN_USERNAME` ถูกแก้ชื่อ และ `ADMIN_PASSWORD` ไม่มีตัวพิมพ์ใหญ่ → ผู้ใช้แก้ → `admin: created "admin"` · ระหว่างนั้น Production ตัวที่ผ่านล่าสุดยังให้บริการ
- ตรวจ `webnppool.vercel.app`: `/` และหน้าที่ต้อง login → 307 ไป `/login` · `/login` 200 · `/api/auth/get-session` 200 · ผู้ใช้ login ด้วยบัญชีผู้ดูแลได้

**พบระหว่างทำ**

- auto mode ไม่ให้ Claude กดยืนยัน deploy ขึ้น Production และไม่ให้เปิดดูค่าของตัวแปร — ผู้ใช้กดเอง
- หน้า Environment Variables ของ Vercel แยกชนิด **Secret** (อ่านย้อนไม่ได้) กับ **Config** และ list ตัดชื่อ key ให้สั้น — ตรวจชื่อเต็มก่อน deploy
- log มีคำเตือนของ `pg` เรื่อง `sslmode=require` ที่จะเปลี่ยนความหมายใน `pg` 9 — ยังไม่กระทบ บันทึกไว้แก้ตอนอัปเดต driver

**ผลลัพธ์**

- Production: `webnppool.vercel.app` · ฐานข้อมูล Neon `nppool-db` (Singapore) มีตารางครบ + สถานะงาน + ผู้ดูแล 1 คน

**ถัดไป**

- ผู้ใช้เพิ่ม `BETTER_AUTH_SECRET` ให้ Preview (B9) · เริ่มขั้นที่ 5 โมดูล 1 ผู้ใช้และสิทธิ์

### 2026-11-27 · เซสชันที่ 2 (ต่อ) · ขั้นที่ 4 — Foundation

**ทำแล้ว**

- Scaffold Next.js 16.4.6 (App Router, Turbopack, Cache Components + Partial Prefetching ตามค่าเริ่มต้น) + TypeScript strict + Tailwind 4.3 + shadcn 4.23 (preset `base-nova` บน Base UI) + ESLint
- ฐานข้อมูล: schema Drizzle 14 ตารางตาม design 03 → `drizzle/0000_init.sql` · seed สถานะใบงาน (รันซ้ำได้) + ประเภทรถตัวอย่างสำหรับพัฒนา · ตัวออกเลขที่ใบงาน (ADR-0007)
- Better Auth: username + admin plugin (3 บทบาท), ปิดสมัครเอง, rate limit ในฐานข้อมูล, session 30 นาทีแบบต่ออายุ (D20) · `proxy.ts` ตรวจ cookie + DAL ตรวจสิทธิ์ที่ server (ADR-0009)
- UI ภาษาไทย: หน้าเข้าสู่ระบบ, layout + sidebar ตามบทบาท, เมนูผู้ใช้ + ออกจากระบบ, หน้าแรก (ทักทาย + ทางลัด), หน้าไม่มีสิทธิ์, หน้า placeholder ที่ตรวจสิทธิ์แล้ว 7 หน้า
- Test 64 รายการ (unit + integration บน PGlite ที่รัน migration จริง): เลขที่ใบงาน, constraint, auth, session หมดอายุด้วยนาฬิกาจำลอง, URL ของ auth บน Vercel
- CI GitHub Actions: lint, typecheck, test, ตรวจ migration ตรงกับ schema, build · `vercel.json` (`sin1`, `vercel-build`) · `.env.example` · `npm run env:check`
- [Runbook 01](docs/runbook/01-vercel-neon-setup.md) ตั้งค่า Vercel + Neon ทีละคลิก (ตรวจกับเอกสาร Neon ฉบับ 2026-11-18) · README · กติกาโปรเจกต์ใน AGENTS.md
- ตรวจบนเครื่อง: lint, typecheck, test และ build ผ่าน · เปิด dev server ตรวจหน้าเข้าสู่ระบบ (ข้อความตรวจฟอร์ม, checkbox, ข้อความเมื่อเข้าสู่ระบบไม่สำเร็จ, redirect จากหน้าที่ต้อง login) — หน้าหลัง login ยังตรวจไม่ได้เพราะไม่มีฐานข้อมูลบนเครื่อง (auto mode ไม่อนุญาตให้เปิด Postgres จำลอง) จะตรวจบน Preview

**พบระหว่างทำ**

- Better Auth ให้ผู้ที่ไม่ติ๊ก “จดจำ” ได้ session 24 ชั่วโมงที่ไม่ต่ออายุ และ Server Component ตั้ง cookie ไม่ได้ — แก้ด้วย D20 พร้อม test
- `next build` ผ่านแม้ไม่มี `BETTER_AUTH_SECRET` แต่ login จะพัง → เพิ่ม `env:check` (D22)
- `Math.random()` ใน component ที่ prerender (รวม `SidebarMenuSkeleton` ของ shadcn) ทำให้ build ล้มเมื่อเปิด Cache Components → ใช้ skeleton ความกว้างคงที่
- Base UI: `Menu.GroupLabel` ต้องอยู่ใน `Menu.Group` ไม่งั้น error ตอนเปิดเมนู (type ไม่จับให้)
- Neon: การเชื่อม project มีตัวเลือก “Create database branch for deployment” (Preview) และ Neon Auth เปิดเป็นค่าเริ่มต้นตอนติดตั้ง

**ผลลัพธ์**

- โค้ดแอป `src/**`, `drizzle/**`, `scripts/**`, `tests/**`, `.github/workflows/ci.yml`, `vercel.json`, `.env.example`, `docs/runbook/01-vercel-neon-setup.md`, README

**ถัดไป**

- ผู้ใช้ทำ runbook 01 → แจ้ง “ตั้งค่าเสร็จแล้ว” → Claude push → Preview แรก → ผู้ใช้เข้าสู่ระบบด้วยบัญชีผู้ดูแลแล้วส่ง Preview URL
- ⏸ อนุมัติจบขั้นที่ 4 และ D19–D23 · ไฟล์โลโก้หรืออนุญาตคัดลอก (B8) · รายการประเภทรถจริง (B6) ก่อนทำส่วนใบงานในขั้นที่ 5

### 2026-11-26 · เซสชันที่ 2 (ต่อ) · ขั้นที่ 3 — Target Design

**ทำแล้ว**

- บันทึกการยืนยันขั้นที่ 2: คำตอบตามค่าเริ่มต้นใน 01-inventory หัวข้อ 15 (20 ข้อ) · 03-feature-parity: MD-08 เข้า MVP, WO-13 เป็น “ยกเลิกใบงาน”, สรุป M 25 · S 9 · C 5 · Drop 7
- ตรวจเวอร์ชันจาก npm (2026-11-26) และเอกสารปัจจุบัน: Better Auth (username/admin plugin, session, rate limit), การที่ Auth.js อยู่ในความดูแลของทีม Better Auth, คำแนะนำของ Vercel/Neon เรื่อง connection บน Fluid compute
- เขียน [Design 01 สถาปัตยกรรม](docs/design/01-architecture.md), [Design 02 หน้าจอและ route map](docs/design/02-screens-and-routes.md), [Design 03 ฐานข้อมูลและ mapping](docs/design/03-database.md) และ [ADR 0001–0011](docs/adr/README.md)
- ตรวจ: ลิงก์ภายในเอกสารทุกลิงก์ใช้ได้ · ตารางทุกตารางคอลัมน์ครบ · ไม่มีความลับหรือชื่อเฉพาะในเอกสาร

**ผลลัพธ์**

- `docs/design/*` 3 ไฟล์ · `docs/adr/*` 12 ไฟล์ (README + 11 ADR)

**ถัดไป**

- ⏸ ผู้ใช้อนุมัติแบบ + ADR ที่เสนอ (D10–D18) และเลือกวิธีพิมพ์ใบสั่งปฏิบัติงาน (D12: A หรือ B)
- ส่งรายการประเภทรถจริง (B6) · เตรียมบัญชี Vercel + Neon สำหรับขั้นที่ 4 (B7)
- เมื่ออนุมัติ → ขั้นที่ 4 Foundation: scaffold Next.js 16, Drizzle + Neon, Better Auth, CI, Preview deployment แรก

### 2026-11-26 · เซสชันที่ 2 (ต่อ) · ผลฐานข้อมูลจริง + ขั้นที่ 2 — Analysis

**ทำแล้ว**

- รันสคริปต์ `docs/rea/sql/01-inventory-readonly.sql` กับ `TCRMIS` บนเครื่องผู้ใช้ (SQL Server 2025 default instance, Windows authentication, SELECT อย่างเดียว) — ผลดิบเก็บนอก repo
  - รอบแรกล้มทั้ง batch เพราะสคริปต์อ้างคอลัมน์ที่มีแค่ใน model C# (`WorkOrders.VehicleId/VehicleTypeId/DriverId`) → แก้สคริปต์และแก้ข้อความผิดเดียวกันใน 01-inventory หัวข้อ 8.1
  - ปรับสคริปต์: แบ่ง batch ด้วย `GO`, ตรวจ `OBJECT_ID` ก่อนอ่านตารางที่อาจไม่มี, ไม่แสดงชื่อ/ขนาดของ schema อื่นในฐานข้อมูลที่ใช้ร่วมกัน, ใช้ `sqlcmd -y 8000` · รันรอบสุดท้ายผ่านทุกส่วนไม่มี error
- ผลสำคัญ: schema `NPPOOL` ในเครื่องเป็นรุ่นก่อน export (ไม่มี `Location_From_To`) · **ไม่มีใบงาน** · ข้อมูลพื้นฐานเป็นข้อมูลทดสอบอย่างละ 1 แถว · มี PK เฉพาะ `Users` ไม่มี FK/trigger/procedure/SQL Agent job · ประเภทรถ/ยี่ห้อรถเป็นข้อมูลตัวอย่างแบบรถยนต์นั่ง · พบอักขระสูญหาย (`?`) จาก code page 874 จริง 1 แถว
- อัปเดต 01-inventory: หัวข้อ 8.0 ผลฐานข้อมูลจริง, คำตอบ Q1–Q3, คำตอบบางส่วนของ Q4, Q7, Q10, Q23, Q25
- ขั้นที่ 2: เขียน 02-domain-model (คำศัพท์, domain model, ER, data dictionary 12 ตาราง, วงจรสถานะแบบสมมติฐาน, role matrix as-is + เสนอ, user flow 9 รายการ), 04-business-rules (33 กฎ พร้อมหลักฐาน ตัวอย่าง และข้อเสนอระบบใหม่), 03-feature-parity (46 ฟีเจอร์: M 24 · S 10 · C 5 · Drop 7, ความต่างที่ตั้งใจ, ตัวอย่างสูตรยอดรวม, ขอบเขต MVP, ค่าเริ่มต้นของคำถามที่ยังไม่ตอบ)
- อัปเดต plan.md (สถานะ, D3/D4 อนุมัติแล้ว) และบทเรียนใหม่ใน skill.md

**ผลลัพธ์**

- [docs/rea/02-domain-model.md](docs/rea/02-domain-model.md) · [docs/rea/03-feature-parity.md](docs/rea/03-feature-parity.md) · [docs/rea/04-business-rules.md](docs/rea/04-business-rules.md) · [docs/rea/01-inventory.md](docs/rea/01-inventory.md) (อัปเดต)

**ถัดไป**

- ⏸ ผู้ใช้ยืนยันการถอดแบบ, ความสำคัญ M/S/C/Drop, ขอบเขต MVP, ความต่างที่ตั้งใจ (03 หัวข้อ 7) และ D2
- ตอบคำถามที่มีผลต่อ MVP (03 หัวข้อ 7 ข้อ 4) — ถ้ายังไม่ตอบจะใช้ค่าเริ่มต้นที่ระบุไว้
- เมื่ออนุมัติ → ขั้นที่ 3 Target Design

### 2026-11-26 · เซสชันที่ 2 (บนเครื่องผู้ใช้) · ขั้นที่ 1 — Discovery & Inventory

**ทำแล้ว**

- ทำงานใน clone ของ repo ที่ `C:\Projects\WebNPPOOL` (plan.md ระบุ `C:\Projects\NPPOOL-web` — ผู้ใช้ตั้งชื่อต่างไป ใช้ได้เหมือนกัน) · อ่านงานเดิม `C:\Projects\NPPool` แบบอ่านอย่างเดียว: ไม่ build, ไม่รัน, ไม่เชื่อมต่อฐานข้อมูล, ไม่คัดลอกไฟล์เข้า repo
- ระบุเทคโนโลยี: ASP.NET Core 8 MVC (C#) + Dapper + SQL Server (`TCRMIS` / schema `NPPOOL`, collation `Thai_CI_AS`) + Identity แบบ custom store + Rotativa/wkhtmltopdf, deploy ด้วย Folder publish ไป IIS
- ทำบัญชี: โครงสร้างไฟล์และขนาด, dependencies, วิธีรัน, config 7 ชุด (ตำแหน่งเท่านั้น), 9 หน้าจอ + endpoint ทั้งหมดพร้อมสิทธิ์ที่บังคับจริง, 3 บทบาท, 12 ตาราง + 14 view (จาก `Database/TCRMIS_Database.xlsx`), เอกสาร PDF 1 แบบ, การเชื่อมต่อภายนอก (ไม่มี), การเข้ารหัสไทยและวันที่
- ใช้ `Gemini_NPPOOL.txt` (บันทึก requirement ที่ผู้พัฒนาสั่ง Gemini) เป็นหลักฐานเจตนาของฟีเจอร์
- เทียบซอร์สกับสำเนา publish ใน `C:\inetpub\wwwroot\NPPOOL` (ดูชื่อ type ใน DLL และรูปแบบ config โดยไม่แสดงค่า): สำเนา publish (2026-03-21) ยังไม่มีหน้าพิมพ์ PDF และหน้าสถานที่รับ-ส่ง
- บันทึกข้อสังเกตเบื้องต้น 24 ข้อ (ความปลอดภัย 9, การทำงาน/ข้อมูล 15) และคำถามค้าง 28 ข้อ
- เขียนสคริปต์อ่านอย่างเดียว `docs/rea/sql/01-inventory-readonly.sql` สำหรับจำนวนแถว, PK/FK/index, trigger, SQL Agent job และคุณภาพข้อมูล — ผลเป็นตัวเลขสรุป (ยังไม่ได้รันกับฐานข้อมูลจริง)
- เพิ่มบทเรียนใหม่และเทคนิคขั้นที่ 1 ใน skill.md · อัปเดตสถานะใน plan.md

**ผลลัพธ์**

- [docs/rea/01-inventory.md](docs/rea/01-inventory.md) · [docs/rea/sql/01-inventory-readonly.sql](docs/rea/sql/01-inventory-readonly.sql)

**ถัดไป**

- ⏸ ผู้ใช้อนุมัติไปขั้นที่ 2 · ตอบคำถามค้างที่ “ต้องการก่อนขั้นที่ 2” (โดยเฉพาะ Q1–Q3, Q5, Q9–Q11) — ตอบครบก่อนเริ่มไม่จำเป็น
- ผู้ใช้รันสคริปต์ หรืออนุญาตให้เซสชันรัน (Q3) และส่งภาพหน้าจอ/PDF ตัวอย่างที่ปิดบังข้อมูลแล้ว
- D2–D4 ยังรอยืนยัน (ไม่กระทบขั้นที่ 2)

**ข้อควรรู้ด้านความปลอดภัย**

- ระหว่างค้นหาความลับ มีคำสั่งค้นหาครั้งหนึ่งแสดงค่า connection string ใน log ของเซสชันบนเครื่องผู้ใช้ (ไม่ได้เข้า repo หรือเอกสาร) — แนะนำให้เปลี่ยนรหัสผ่านฐานข้อมูลของระบบเดิมอยู่แล้ว (ดู 01-inventory.md ข้อ S5)

### 2026-11-25 · เซสชันที่ 1 (ต่อ) · ส่งต่องานให้เซสชันบนเครื่องผู้ใช้

**ทำแล้ว**

- ผู้ใช้เลือกวิธี C → เพิ่มขั้นตอนเตรียมเครื่องและข้อความส่งต่องาน (handoff) ใน plan.md หัวข้อ 5
- กำหนดโครงสร้างบนเครื่อง: `C:\Projects\NPPool` = งานเดิม (อ่านอย่างเดียว), `C:\Projects\NPPOOL-web` = clone ของ repo นี้ (ชื่อต้องไม่ซ้ำ เพราะ Windows ไม่แยกตัวพิมพ์เล็ก-ใหญ่)
- เพิ่ม workflow แบบเซสชันคลาวด์ + เซสชันบนเครื่องผู้ใช้ และบทเรียนใหม่ใน skill.md

**ถัดไป**

- ผู้ใช้ clone repo → เริ่มเซสชัน Claude Code บนเครื่องในโฟลเดอร์ `C:\Projects\NPPOOL-web` → วางข้อความส่งต่องาน
- เซสชันบนเครื่องทำขั้นที่ 1 → push → ขออนุมัติขั้นที่ 2
- ระหว่างนั้นเซสชันคลาวด์จะไม่ commit ลง branch นี้เพิ่ม เพื่อไม่ให้ชนกัน

### 2026-11-25 · เซสชันที่ 1 (ต่อ) · รอเริ่มขั้นที่ 1

**ทำแล้ว**

- Push `plan.md`, `Roadmap.md`, `skill.md` ขึ้น branch `claude/nppool-reverse-engineering-gvbib9` (commit `9be6efa`)
- ผู้ใช้แจ้งเปิด Remote Control และให้ดำเนินงานต่อ → ตรวจรายการโฟลเดอร์ที่เซสชันนี้ใช้ได้อีกครั้ง: ยังว่าง ไม่มีเครื่องหรือโฟลเดอร์ใดแสดง → ยังเริ่มขั้นที่ 1 ไม่ได้

**ถัดไป**

- ผู้ใช้เพิ่มโฟลเดอร์ `C:\Projects\NPPool` ใน Claude desktop app → Settings → Claude Code → Remote Control แล้วแจ้งกลับ หรือเลือกวิธี A / C (plan.md หัวข้อ 5)
- เมื่อเชื่อมต่อได้ → เริ่มขั้นที่ 1 (Discovery & Inventory)

### 2026-11-25 · เซสชันที่ 1 · ขั้นที่ 0 — เริ่มโครงการ

**ทำแล้ว**

- สำรวจ repo `ATTAKORNTH2010/NPPOOL`: มีเพียง `README.md` (“Logistic app”) และ commit เดียว (Initial commit); visibility = public
- ตรวจการเข้าถึง `C:\Projects\NPPool`: ยังไม่มีโฟลเดอร์ใดจากเครื่องผู้ใช้แชร์ให้เซสชันคลาวด์ → เข้าถึงไม่ได้ (B1)
- ตรวจเวอร์ชันจาก npm: Next.js 16.4.6 (Node ≥ 20.9), React 19.3.1, drizzle-orm 0.45.4, drizzle-kit 0.31.11, @neondatabase/serverless 1.2.1, tailwindcss 4.3.5, zod 4.6.7
- ยืนยันสถานะ Vercel Postgres: เลิกให้บริการ, ฐานข้อมูลเดิมย้ายไป Neon (ธ.ค. 2024), `@vercel/postgres` deprecated; ฐานข้อมูลใหม่ติดตั้งผ่าน Vercel Marketplace → Neon
- สร้าง `plan.md` (แผน v0.1), `Roadmap.md`, `skill.md`

**ถัดไป**

- รอผู้ใช้อนุมัติ D1–D4 และเลือกวิธีเข้าถึงงานเดิม
- เมื่อเข้าถึงได้ → เริ่มขั้นที่ 1 (Discovery & Inventory)
