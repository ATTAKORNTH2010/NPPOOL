# ADR-0003: Drizzle ORM + การเชื่อมต่อฐานข้อมูลบน Vercel

- สถานะ: อนุมัติ (Drizzle: D4 2026-11-26 · driver: D10 2026-11-27)
- วันที่: 2026-11-26

## บริบท

- การบันทึกใบงานต้องออกเลขที่ + บันทึกใบงาน + รถทุกคันใน **transaction เดียวแบบ interactive** (ADR-0007)
- Vercel Fluid compute ให้หลาย request ใช้ instance เดียวกันได้ → ใช้ connection pool ร่วมกันได้ แต่ต้องปิด connection ที่ว่างก่อน instance หยุด

## ทางเลือก (driver)

| ทางเลือก | Transaction แบบ interactive | หมายเหตุ |
|---|---|---|
| A. `drizzle-orm/neon-http` (Neon serverless driver ผ่าน HTTP) | ❌ ทำได้แค่แบบ non-interactive | Neon แนะนำให้ใช้กับ query เดี่ยว ([Neon docs](https://neon.com/docs/serverless/serverless-driver)) |
| B. `drizzle-orm/neon-serverless` (WebSocket `Pool`) | ✅ | Neon เตือนไม่ให้สร้าง `Pool` ระดับ global ใน serverless แบบเดิม เพราะอาจไม่ถูกปิด |
| C. `drizzle-orm/node-postgres` + `pg` `Pool` + `attachDatabasePool()` ของ `@vercel/functions` | ✅ | Vercel แนะนำสำหรับ Fluid compute: สร้าง pool ระดับ module แล้ว attach ให้ปิด connection ที่ว่างก่อน instance หยุด ([Vercel KB](https://vercel.com/kb/guide/efficiently-manage-database-connection-pools-with-fluid-compute)) · Neon แนะนำ TCP + pool สำหรับ Fluid ([Neon guide](https://neon.com/docs/guides/vercel-connection-methods)) |

## การตัดสินใจ

- **C** — `pg` 8.x `Pool` ต่อ connection string แบบ pooled ของ Neon, `attachDatabasePool(pool)`, `drizzle(pool)` · ขนาด pool เล็ก (เริ่มที่ไม่กี่ connection แล้วปรับตามการใช้งาน)
- Migration ใช้ `drizzle-kit` (0.31.x) ผ่าน connection แบบ unpooled
- drizzle-orm 0.45.x (ตรวจเวอร์ชันซ้ำตอน scaffold)

## ผลที่ตามมา

- ใช้ได้เฉพาะ Node.js runtime (ไม่ใช่ Edge) — สอดคล้องกับ ADR-0001
- `db.transaction(async (tx) => …)` ใช้ได้ตรงๆ สำหรับการบันทึกใบงาน
- คอลัมน์ `numeric` คืนค่าเป็น string — ห้ามแปลงเป็น number ก่อนคำนวณเงิน
- ต้องตรวจวิธีใช้ `attachDatabasePool` กับเอกสาร Vercel ฉบับปัจจุบันในขั้นที่ 4 · ถ้าไม่ได้ใช้ Fluid compute ให้กลับไปพิจารณา B โดยสร้าง pool ต่อ request
