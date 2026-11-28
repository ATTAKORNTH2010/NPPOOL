# Runbook 01: ตั้งค่า Vercel + Neon และ Preview deployment แรก

- ขั้นที่ 4 (Foundation) · ผู้ใช้ทำเองในบัญชีของตัวเอง — Claude ไม่เข้าบัญชีและไม่กรอกรหัสผ่านแทน
- อ้างอิง: [ADR-0001](../adr/0001-nextjs-on-vercel.md) · [ADR-0002](../adr/0002-neon-postgres.md) · [ADR-0004](../adr/0004-auth-better-auth.md) · [ADR-0011](../adr/0011-migrations-and-seed-data.md) · [design 01 หัวข้อ environment](../design/01-architecture.md)
- ตรวจกับเอกสาร Neon “Vercel-Managed Integration” (ปรับปรุง 2026-11-18) — ถ้าชื่อปุ่มบนหน้าจอต่างไปเล็กน้อย ให้ยึดความหมายตามตารางนี้

## ภาพรวม

| # | ทำอะไร | ใช้เวลาโดยประมาณ |
|---|---|---|
| 1 | Import repo เข้า Vercel | 3 นาที |
| 2 | ติดตั้ง Neon จาก Vercel Marketplace แล้วเชื่อมกับ project (แยก branch ต่อ Preview) | 5 นาที |
| 3 | ตั้ง environment variables ของแอป | 5 นาที |
| 4 | สั่ง deploy branch งาน → ได้ Preview URL | 3–5 นาที |
| 5 | เข้าสู่ระบบด้วยบัญชีผู้ดูแลแรก แล้วส่ง URL ให้ Claude ตรวจ | 2 นาที |

สิ่งที่ต้องมี: บัญชี GitHub ที่เป็นเจ้าของ repo `ATTAKORNTH2010/NPPOOL` และบัญชี Vercel (สมัครด้วย GitHub สะดวกสุด) — งานของบริษัทต้องใช้ทีมแผน **Pro** เพราะข้อตกลงของ Vercel ให้ Hobby ใช้ได้เฉพาะงานส่วนตัวหรือไม่ใช่เชิงพาณิชย์ (Roadmap B10)

## 1. Import repo เข้า Vercel

1. เปิด <https://vercel.com/new>
2. ที่ “Import Git Repository” หา `NPPOOL` — ถ้าไม่เห็น ให้กด **Adjust GitHub App Permissions** แล้วอนุญาต repo นี้
3. กด **Import**
4. หน้า Configure Project
   - Project Name: `nppool` (หรือชื่ออื่นก็ได้)
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build and Output Settings: ไม่ต้องแก้ (ใช้ค่าจาก `vercel.json`)
   - Environment Variables: ยังไม่ต้องใส่
5. กด **Deploy**

> Build ครั้งแรกนี้เป็นของ branch `main` และ **จะไม่ผ่าน** เพราะ `main` ยังมีแต่เอกสาร (แอปอยู่ใน branch งาน) — เป็นเรื่องปกติ project ถูกสร้างแล้ว ให้ไปที่หน้า project ต่อ

## 2. ติดตั้ง Neon และเชื่อมกับ project

1. ในหน้า project → แท็บ **Storage** → **Create Database** → เลือก **Neon** → **Continue**
   (หรือเปิด <https://vercel.com/marketplace/neon> → **Install**)
2. ถ้าถามเรื่องบัญชี: เลือก **Create New Neon Account** → Continue
3. ถ้าถาม Team: เลือก team ของคุณ → Continue
4. **Configuration and Plan**
   - Region: **Singapore** (`aws-ap-southeast-1`) — ให้อยู่ใกล้ function region `sin1` ใน `vercel.json`
   - **Auth: ปิด** — แอปใช้ Better Auth ของตัวเอง ไม่ใช้ Neon Auth
   - Realtime: ปิด
   - Installation Plan: **Free** → Continue
5. **Confirmation**: ตั้ง Resource Name เช่น `nppool-db` → **Create**
6. เมื่อขึ้น “Your Neon database is ready to use” → **Continue**
7. **Connect a Project** (ถ้าเผลอกด Skip: Storage → `nppool-db` → **Connect to Project**)

   | ช่อง | ค่าที่เลือก | เหตุผล |
   |---|---|---|
   | Project | `nppool` | |
   | Environments | ✅ Production · ✅ Preview · ☐ **Development (ไม่ติ๊ก)** | Development จะได้ connection ของ branch หลัก (production) — ห้ามใช้บนเครื่องผู้พัฒนา (design 01) ฐานข้อมูลสำหรับพัฒนาจะแยก branch ภายหลัง |
   | **Create database branch for deployment** | ✅ **Preview** · ☐ Production | Preview ของแต่ละ git branch ได้ Neon branch ของตัวเอง (`preview/<ชื่อ branch>`) migration และข้อมูลทดสอบจึงไม่แตะ production (ADR-0011) |
   | Custom Prefix | เว้นว่าง | แอปอ่านชื่อ `DATABASE_URL` และ `DATABASE_URL_UNPOOLED` |
   | Sensitive | เปิด (ค่าเริ่มต้น) | อ่านค่าย้อนจาก dashboard ไม่ได้ ปลอดภัยกว่า |

   กด **Connect**
8. ตรวจ: Settings → **Environment Variables** ต้องเห็น `DATABASE_URL` และ `DATABASE_URL_UNPOOLED` (มี `PG*`, `POSTGRES_*`, `NEON_PROJECT_ID` เพิ่มมาด้วย — ปล่อยไว้) ค่าเป็น Sensitive จึงอ่านไม่ได้ — ปกติ
   ค่าของ Preview branch จะไม่แสดงในหน้านี้ Neon ใส่ให้ตอน deploy

## 3. ตั้ง environment variables ของแอป

Settings → **Environment Variables** → **Add Environment Variable** → เพิ่มทีละตัว (หน้าจอปี 2026 ให้เลือก Type: **Secret** = อ่านย้อนไม่ได้ · **Config** = อ่านได้)

| Key (ต้องสะกดตรงทุกตัว) | ค่า | Environments | Type |
|---|---|---|---|
| `BETTER_AUTH_SECRET` | ค่าสุ่ม ≥ 32 ตัวอักษร — **ใช้คนละค่า** ระหว่าง Production กับ Preview (เพิ่ม key เดียวกัน 2 ครั้ง) | Production · Preview | Secret |
| `ADMIN_USERNAME` | ชื่อผู้ใช้ของผู้ดูแลคนแรก เช่น `admin` (a-z 0-9 `_` `.` ยาว 3–30) | Production · Preview | Config |
| `ADMIN_NAME` | ชื่อที่แสดง เช่น `ผู้ดูแลระบบ` | Production · Preview | Config |
| `ADMIN_PASSWORD` | รหัสผ่าน 8–128 ตัว มี**ตัวพิมพ์ใหญ่** ตัวพิมพ์เล็ก ตัวเลข และสัญลักษณ์ — จดไว้ในโปรแกรมเก็บรหัสผ่านก่อนกด Save | Production | Secret |

> ทำจริงเมื่อ 2026-11-27: `main` ถูก merge ก่อน Production จึงขึ้นก่อน Preview — build แรกของ Production สร้างตาราง และผู้ดูแลในฐานข้อมูลหลัก · Preview ทุก branch คัดลอกฐานข้อมูลจากหลัก (มีผู้ดูแลอยู่แล้ว) จึงต้องการแค่ `BETTER_AUTH_SECRET` ของ Preview

สร้างค่า `BETTER_AUTH_SECRET` บนเครื่องตัวเอง (PowerShell) — รัน 1 ครั้งต่อ 1 ค่า แล้วคัดลอกผลลัพธ์ไปวางในช่อง Value:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

ข้อควรรู้

- **ห้าม** วางรหัสผ่านหรือ secret ใน GitHub, ในแชต หรือในไฟล์ของ repo
- `ADMIN_*` ใช้โดย `npm run admin:ensure` ซึ่งรันทุกครั้งที่ build: สร้างผู้ดูแลเฉพาะเมื่อยังไม่มีชื่อผู้ใช้นี้ และไม่พิมพ์รหัสผ่านลง log
- **สร้างแล้วจะไม่เปลี่ยนตาม env:** แก้ `ADMIN_PASSWORD` ภายหลังไม่เปลี่ยนรหัสของบัญชีที่มีอยู่ — ลืมรหัสให้ผู้ดูแลอีกคนตั้งรหัสใหม่ในหน้า “จัดการผู้ใช้” (ขั้นที่ 5)
- รหัสผ่านไม่ผ่านนโยบาย → build ล้ม (`admin bootstrap failed: ADMIN_PASSWORD: …`) แต่ Production ตัวเดิมยังให้บริการ
- **ไม่ต้อง** ตั้ง `BETTER_AUTH_URL` บน Vercel แอปคำนวณ URL จากตัวแปรระบบของ Vercel เอง (ตั้งเฉพาะเมื่อมีโดเมนของตัวเอง) — ต้องติ๊ก “Enable access to System Environment Variables” ไว้ (ค่าเริ่มต้น)

## 4. สั่ง deploy branch งาน

เลือกทางใดทางหนึ่ง

- **ทาง A (ง่ายสุด):** พิมพ์บอก Claude ว่า “ตั้งค่าเสร็จแล้ว” — Claude จะ push commit ขึ้น branch งาน แล้ว Vercel build Preview ให้อัตโนมัติ
- **ทาง B:** Vercel → project → แท็บ **Deployments** → เมนู **⋯** มุมขวาบน → **Create Deployment** → ใส่ branch `claude/nppool-reverse-engineering-gvbib9` → **Create Deployment**

ใน Build Logs ควรเห็นตามลำดับ

```text
> npm run env:check           env check: required variables are set
> npm run db:migrate          ← สร้างตารางใน Neon branch ของ Preview
> npm run db:seed             seed: work statuses up to date
> npm run admin:ensure        admin: created "<ชื่อผู้ใช้>"
> next build                  ✓ Compiled successfully
```

## 5. ตรวจหลัง deploy

1. ที่ deployment ล่าสุด กด **Visit** (Vercel อาจให้ login Vercel ก่อน — คือ Deployment Protection ของ Preview ให้เปิดไว้แบบนั้น)
2. ระบบพาไปหน้า **เข้าสู่ระบบ** → ใส่ `ADMIN_USERNAME` และ `ADMIN_PASSWORD`
3. ต้องเห็นหน้าแรก “สวัสดี …” และเมนูครบ 3 กลุ่ม — หน้าในเมนูยังขึ้น “อยู่ระหว่างพัฒนา” (สร้างจริงในขั้นที่ 5)
4. มุมขวาบน → ชื่อของคุณ → **ออกจากระบบ** → ต้องกลับหน้าเข้าสู่ระบบ
5. ส่ง **Preview URL** ให้ Claude (ส่งเฉพาะ URL ไม่ต้องส่งรหัสผ่าน)

## แก้ปัญหา

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| `env check failed: DATABASE_URL… is not set` | Neon ยังไม่เชื่อมกับ Preview | ทำข้อ 2.7–2.8 แล้ว Redeploy |
| `env check failed: BETTER_AUTH_SECRET …` | ยังไม่ได้ตั้ง หรือสั้นกว่า 32 ตัว | ทำข้อ 3 แล้ว Redeploy |
| Build ล้มที่ `db:migrate` (connection error) | Neon branch ของ Preview ยังสร้างไม่เสร็จ หรือการเชื่อมผิด | Redeploy อีกครั้ง ถ้ายังไม่ผ่านให้ส่ง log ช่วงนั้นให้ Claude (ตัดค่าที่เป็นความลับออก) |
| `admin bootstrap failed: ADMIN_PASSWORD: …` | รหัสผ่านไม่ตรงนโยบาย | แก้ค่าแล้ว Redeploy |
| Log ขึ้น `admin: ADMIN_USERNAME / ADMIN_PASSWORD not set — skipping` | ยังไม่ได้ตั้ง `ADMIN_*` ให้ Preview | ทำข้อ 3 แล้ว Redeploy |
| เข้าสู่ระบบแล้วขึ้น “ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง” | พิมพ์ผิด หรือเพิ่ม `ADMIN_*` หลัง build (ยังไม่ได้สร้างผู้ดูแล) | Redeploy แล้วลองใหม่ |
| “พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่” | เกิน 5 ครั้งต่อนาที | รอ 1 นาที |

Redeploy: แท็บ Deployments → deployment ล่าสุดของ branch งาน → **⋯** → **Redeploy**

## ทำภายหลัง (ไม่ต้องทำตอนนี้)

- ขั้นที่ 5: ฐานข้อมูลสำหรับพัฒนาบนเครื่อง — สร้าง branch `dev` ใน Neon Console แล้วใส่ connection ลง `.env.local` (ไม่ใช้ connection ของ production)
- ขั้นที่ 7 (ขึ้นระบบจริง): `ADMIN_*` และ `BETTER_AUTH_SECRET` ของ Production · โดเมน + `BETTER_AUTH_URL` · ลบ `ADMIN_PASSWORD` เมื่อมีหน้าจัดการผู้ใช้แล้ว
