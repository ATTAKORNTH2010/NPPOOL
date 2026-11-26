# Architecture Decision Records (ADR) — NPPool

แม่แบบ: [skill.md หัวข้อ 4.6](../../skill.md) · แบบระบบ: [docs/design](../design/01-architecture.md)

| ADR | หัวข้อ | สถานะ | วันที่ |
|---|---|---|---|
| [0001](0001-nextjs-on-vercel.md) | Next.js 16 (App Router) + TypeScript บน Vercel | ✅ อนุมัติ (D2) | 2026-11-26 |
| [0002](0002-neon-postgres.md) | Postgres = Neon ผ่าน Vercel Marketplace | ✅ อนุมัติ (D3) | 2026-11-26 |
| [0003](0003-drizzle-and-db-connection.md) | Drizzle ORM + การเชื่อมต่อฐานข้อมูลบน Vercel | ✅ Drizzle อนุมัติ (D4) · ⏸ driver เสนอ | 2026-11-26 |
| [0004](0004-auth-better-auth.md) | ระบบยืนยันตัวตน = Better Auth | ⏸ เสนอ | 2026-11-26 |
| [0005](0005-job-order-printing.md) | การพิมพ์ใบสั่งปฏิบัติงาน | ⏸ เสนอ — ขอให้เลือก | 2026-11-26 |
| [0006](0006-ui-kit-and-thai-fonts.md) | UI = Tailwind + shadcn/ui + ฟอนต์ไทย | ⏸ เสนอ | 2026-11-26 |
| [0007](0007-work-order-numbering.md) | การออกเลขที่ใบงาน | ⏸ เสนอ | 2026-11-26 |
| [0008](0008-dates-timezone-buddhist-year.md) | วันเวลา, timezone และปี พ.ศ. | ⏸ เสนอ | 2026-11-26 |
| [0009](0009-authorization-deny-by-default.md) | การตรวจสิทธิ์แบบ deny by default | ⏸ เสนอ | 2026-11-26 |
| [0010](0010-no-hard-delete.md) | ไม่ลบถาวร: ยกเลิกใบงาน / ปิดใช้งานข้อมูลพื้นฐาน | ⏸ เสนอ | 2026-11-26 |
| [0011](0011-migrations-and-seed-data.md) | Migration, ข้อมูลตั้งต้น และการไม่ย้ายข้อมูลธุรกรรม | ✅ ไม่ย้ายข้อมูล (D8) · ⏸ วิธี migrate เสนอ | 2026-11-26 |
