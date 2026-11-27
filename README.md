# NP Pool

ระบบจัดการงานขนส่ง NP Pool — สร้างใหม่ด้วย Next.js บน Vercel + Postgres (Neon) แทนระบบเดิม (ASP.NET Core + SQL Server)

- แผนงานและสถานะ: [plan.md](plan.md) · [Roadmap.md](Roadmap.md)
- ผลวิเคราะห์ระบบเดิม: [docs/rea](docs/rea) · การออกแบบ: [docs/design](docs/design) · การตัดสินใจ: [docs/adr](docs/adr)
- ตั้งค่า Vercel + Neon: [docs/runbook/01-vercel-neon-setup.md](docs/runbook/01-vercel-neon-setup.md)

## เทคโนโลยี

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui (Base UI) · Drizzle ORM + Neon Postgres · Better Auth (username + บทบาท) · Vitest + PGlite

## โครงสร้าง

```text
src/app/(auth)/login     หน้าเข้าสู่ระบบ
src/app/(app)/           หน้าที่ต้อง login (เมนูตามบทบาท)
src/app/api/auth/        Better Auth route handler
src/components/layout/   sidebar, เมนูผู้ใช้, ส่วนหัวหน้า
src/db/schema/           schema ของ Drizzle → drizzle/ (ไฟล์ migration SQL)
src/features/            กฎธุรกิจแยกตามเรื่อง (เช่น เลขที่ใบงาน)
src/lib/                 auth, สิทธิ์ (permissions), DAL, การจัดรูปแบบวันที่/เงิน
scripts/                 seed ข้อมูลอ้างอิง, สร้างผู้ดูแลคนแรก
tests/                   unit + integration (PGlite รัน migration จริงในหน่วยความจำ)
```

## พัฒนาบนเครื่อง

ต้องมี Node.js 24 และ Postgres สำหรับพัฒนา (Neon branch `dev` — ห้ามใช้ฐานข้อมูล production)

```powershell
npm ci
```

```powershell
Copy-Item .env.example .env.local
```

แก้ `.env.local` ใส่ค่า (ดูคำอธิบายในไฟล์) แล้ว

```powershell
npm run db:migrate
```

```powershell
npm run db:seed -- --sample-vehicle-types
```

```powershell
npm run admin:ensure
```

```powershell
npm run dev
```

เปิด <http://localhost:3000>

## คำสั่ง

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run lint` · `npm run typecheck` · `npm test` | ตรวจโค้ด · ตรวจชนิด · test ทั้งหมด (ไม่ต้องมีฐานข้อมูล) |
| `npm run build` | build production (ต้องมี `BETTER_AUTH_SECRET`) |
| `npm run db:generate` | สร้างไฟล์ migration จาก schema — ตรวจ SQL ใน `drizzle/` ก่อน commit |
| `npm run db:migrate` · `npm run db:seed` | migrate · seed ข้อมูลอ้างอิง (รันซ้ำได้) |
| `npm run admin:ensure` | สร้างผู้ดูแลคนแรกจาก `ADMIN_*` ถ้ายังไม่มี |
| `npm run env:check` | ตรวจว่ามีตัวแปรที่จำเป็นครบ (แสดงแค่ชื่อ ไม่แสดงค่า) |
| `npm run vercel-build` | สิ่งที่ Vercel รัน: ตรวจ env → migrate → seed → admin → build |

CI (GitHub Actions) รัน lint, typecheck, test, ตรวจว่า migration ตรงกับ schema และ build ทุกครั้งที่ push

## ความปลอดภัย

repo นี้เป็น public — ห้าม commit ความลับ (connection string, รหัสผ่าน, secret) ข้อมูลลูกค้า หรือข้อมูลส่วนบุคคล ค่าจริงอยู่ใน Vercel Environment Variables และ `.env.local` (ไม่เข้า git) เท่านั้น
