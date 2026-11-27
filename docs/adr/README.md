# Architecture Decision Records (ADR) — NPPool

แม่แบบ: [skill.md หัวข้อ 4.6](../../skill.md) · แบบระบบ: [docs/design](../design/01-architecture.md)

| ADR | หัวข้อ | สถานะ | วันที่ |
|---|---|---|---|
| [0001](0001-nextjs-on-vercel.md) | Next.js 16 (App Router) + TypeScript บน Vercel | ✅ อนุมัติ | 2026-11-26 |
| [0002](0002-neon-postgres.md) | Postgres = Neon ผ่าน Vercel Marketplace | ✅ อนุมัติ | 2026-11-26 |
| [0003](0003-drizzle-and-db-connection.md) | Drizzle ORM + การเชื่อมต่อฐานข้อมูลบน Vercel | ✅ อนุมัติ | 2026-11-27 |
| [0004](0004-auth-better-auth.md) | ระบบยืนยันตัวตน = Better Auth | ✅ อนุมัติ | 2026-11-27 |
| [0005](0005-job-order-printing.md) | การพิมพ์ใบสั่งปฏิบัติงาน | ✅ อนุมัติ — ใช้ทางเลือก A | 2026-11-27 |
| [0006](0006-ui-kit-and-thai-fonts.md) | UI = Tailwind + shadcn/ui + ฟอนต์ไทย | ✅ อนุมัติ | 2026-11-27 |
| [0007](0007-work-order-numbering.md) | การออกเลขที่ใบงาน | ✅ อนุมัติ | 2026-11-27 |
| [0008](0008-dates-timezone-buddhist-year.md) | วันเวลา, timezone และปี พ.ศ. | ✅ อนุมัติ | 2026-11-27 |
| [0009](0009-authorization-deny-by-default.md) | การตรวจสิทธิ์แบบ deny by default | ✅ อนุมัติ | 2026-11-27 |
| [0010](0010-no-hard-delete.md) | ไม่ลบถาวร: ยกเลิกใบงาน / ปิดใช้งานข้อมูลพื้นฐาน (+ ลบใบงานแบบซ่อน 2026-11-27) | ✅ อนุมัติ · ส่วนเพิ่มเติม ⏸ รอตรวจ | 2026-11-27 |
| [0011](0011-migrations-and-seed-data.md) | Migration, ข้อมูลตั้งต้น และการไม่ย้ายข้อมูลธุรกรรม | ✅ อนุมัติ | 2026-11-27 |
| [0012](0012-activity-log.md) | Activity Log — การใช้งานของผู้ใช้แต่ละคนในแต่ละฟังก์ชัน | ⏸ ทำตามคำขอ รอตรวจ | 2026-11-27 |
