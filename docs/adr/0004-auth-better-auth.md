# ADR-0004: ระบบยืนยันตัวตน = Better Auth

- สถานะ: อนุมัติ (D11 — 2026-11-27)
- วันที่: 2026-11-26

## บริบท

ความต้องการจากขั้นที่ 2 (AUTH-01 ถึง AUTH-07, role matrix 02-domain-model หัวข้อ 6.2):

- login ด้วย **username** + รหัสผ่าน (ระบบเดิมไม่ใช้อีเมล) · 3 บทบาท: admin, maker, accounting
- **Admin เป็นผู้สร้างบัญชี** (ไม่มีการสมัครเอง — S1) · ตั้งรหัสผ่านใหม่ / ระงับบัญชีได้
- session 30 นาทีแบบต่ออายุเมื่อใช้งาน + “จดจำการเข้าสู่ระบบ” · จำกัดการเดารหัสผ่าน (S6)
- ข้อมูลผู้ใช้อยู่ใน Postgres ของเราเอง (Drizzle)

## ทางเลือก

| ทางเลือก | ข้อดี | ข้อเสีย |
|---|---|---|
| **Better Auth** (1.7.28) | มี username plugin (login ด้วย username, ไม่สนตัวพิมพ์), admin plugin (สร้างผู้ใช้, กำหนดบทบาท, ตั้งรหัสผ่าน, ระงับ, รายชื่อผู้ใช้), Drizzle adapter, session ในฐานข้อมูล, rate limit ในตัว · ทีม Better Auth รับดูแล Auth.js และแนะนำให้โปรเจกต์ใหม่ใช้ Better Auth ([ประกาศ](https://better-auth.com/blog/authjs-joins-better-auth)) | core บังคับให้ผู้ใช้มีอีเมลไม่ซ้ำ → ต้องใช้อีเมลสมมติ (ด้านล่าง) |
| Auth.js (NextAuth) | คนใช้มาก | v5 ยังไม่ออกเป็นรุ่นเสถียร (npm `next-auth` ล่าสุดยังเป็น 4.24.15) · credentials provider ไม่มีการจัดการผู้ใช้/รหัสผ่านให้ ต้องเขียนเองเกือบทั้งหมด · อยู่ในโหมดดูแลด้านความปลอดภัย |
| Clerk | ระบบสำเร็จรูป มีหน้าจัดการผู้ใช้ | ข้อมูลผู้ใช้อยู่นอกฐานข้อมูลของเรา (ต้องพิจารณา PDPA), คิดเงินตามจำนวนผู้ใช้, ผูกกับผู้ให้บริการ |
| เขียนเอง | ควบคุมทุกอย่าง | เสี่ยงด้านความปลอดภัยและใช้เวลามากที่สุด |

## การตัดสินใจ (เสนอ)

Better Auth 1.7.x + Drizzle adapter:

- `emailAndPassword` เปิดไว้เพื่อใช้บัญชีแบบรหัสผ่าน แต่**ปิดการสมัครเอง** (ชื่อ option ตรวจในขั้นที่ 4) · ไม่ใช้ฟีเจอร์ที่ส่งอีเมล (ยืนยันอีเมล / ลืมรหัสผ่านทางอีเมล) — Admin เป็นผู้ตั้งรหัสผ่านใหม่
- **username plugin:** login ด้วย `signIn.username` · username a–z, 0–9, `_`, `.` ยาว 3–30 ตัว ไม่สนตัวพิมพ์ (ค่าตั้งต้นของ plugin)
- **admin plugin:** บทบาท `admin`, `maker`, `accounting` (custom roles ด้วย access control ของ plugin) · ใช้ `createUser`, `setRole`, `setUserPassword`, `banUser`/`unbanUser` (ระงับแล้ว session ถูกเพิกถอน), `listUsers` ในหน้า `/admin/users`
- **อีเมลสมมติ:** core ของ Better Auth ต้องมี `email` ไม่ซ้ำ → ระบบสร้างให้อัตโนมัติจาก username รูปแบบ `<username>@users.nppool.invalid` (โดเมน `.invalid` สงวนไว้ ส่งอีเมลไม่ได้จริง) และไม่แสดงในหน้าจอ
- **session** เก็บในฐานข้อมูล (เพิกถอนได้ทันที) · อายุ 30 นาทีและต่ออายุเมื่อใช้งาน (ตั้ง `expiresIn` / `updateAge` — ทดสอบพฤติกรรมจริงในขั้นที่ 4) · “จดจำการเข้าสู่ระบบ” ตามที่ไลบรารีรองรับ
- **rate limit** เก็บในฐานข้อมูล (หน่วยความจำไม่เหมาะกับ serverless ตามเอกสาร [Better Auth](https://better-auth.com/docs/concepts/rate-limit)) + กฎเข้มสำหรับ `/sign-in/username`
- **นโยบายรหัสผ่าน** ≥ 8 ตัว มีพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข สัญลักษณ์ — ตรวจด้วย Zod ในฟอร์มที่ Admin ตั้งรหัสและฟอร์มเปลี่ยนรหัส + ตั้งความยาวขั้นต่ำใน Better Auth ด้วย

## ผลที่ตามมา

- ต้องทดสอบในขั้นที่ 4: สร้างผู้ใช้พร้อม username ผ่าน admin plugin (เช่น ส่งใน `data`), ตั้งชื่อตารางเป็น `users`/`sessions`/`accounts` (หลีก `user` ซึ่งเป็นคำสงวนของ Postgres), พฤติกรรม session 30 นาที
- กฎ “ห้ามระงับ/ลดบทบาท Admin คนสุดท้าย” และ “Admin ระงับตัวเองไม่ได้” เขียนในแอปเอง
- ไม่ย้ายรหัสผ่านจากระบบเดิม (AUTH-09 Drop) — ไม่ต้องรองรับ hash ของ ASP.NET Core Identity
- username ใช้ `-` `@` `+` ไม่ได้ (ระบบเดิมได้) — ไม่กระทบเพราะสร้างบัญชีใหม่ทั้งหมด

## ผลตรวจในขั้นที่ 4 (2026-11-27)

- ปิดสมัครเอง: `emailAndPassword.disableSignUp: true` · ตาราง `users`, `sessions`, `accounts`, `verifications`, `rate_limits` (Drizzle adapter `usePlural`) — ผ่าน integration test บน PGlite
- `createUser` + `data: { username, displayUsername }` ใช้ได้ · login ไม่สนตัวพิมพ์ · ผู้ใช้ที่ถูกระงับ login ไม่ได้
- rate limit: `/sign-in/username` 5 ครั้งต่อ 60 วินาที เก็บในฐานข้อมูล
- **session (BR-AU-03):** ไลบรารีให้ผู้ที่ไม่ติ๊ก “จดจำ” ได้ session 24 ชั่วโมงแบบไม่ต่ออายุ และ Server Component ตั้ง cookie ไม่ได้ จึงเพิ่ม
  - `src/lib/auth/session-policy.ts`: จำกัดทุก session ที่ 30 นาที และเลื่อนอายุ session แบบไม่จดจำเมื่อใช้งานเกิน `updateAge` (5 นาที)
  - DAL อ่าน session ด้วย `disableRefresh` (ไม่ให้แถวในฐานข้อมูลกับ cookie อายุไม่ตรงกัน)
  - `SessionKeepAlive` ในหน้าที่ login แล้ว เรียก `/api/auth/get-session` เมื่อเปลี่ยนหน้า/คลิก/พิมพ์ (ไม่เกินนาทีละครั้ง) และพาไปหน้า login เมื่อหมดอายุ
  - ผล (test ด้วยนาฬิกาจำลอง): ทั้งสองแบบหมดอายุเมื่อไม่ใช้งาน 30 นาที · “จดจำ” = cookie อยู่รอดหลังปิด browser · ไม่จดจำ = cookie หายเมื่อปิด browser
- ผู้ดูแลคนแรก: ตั้ง `ADMIN_USERNAME` / `ADMIN_NAME` / `ADMIN_PASSWORD` ใน Vercel แล้ว `npm run admin:ensure` ใน build สร้างให้ถ้ายังไม่มี — ไม่มีใครต้องถือรหัสผ่านไว้บนเครื่องหรือใน repo
- `next build` ผ่านแม้ไม่มี `BETTER_AUTH_SECRET` (ไปพังตอน login) → `npm run env:check` เป็นขั้นแรกของ `vercel-build`
- CLI ของ Better Auth คือแพ็กเกจ `auth` (`npx auth@latest …`)
