# 01 — Inventory ระบบเดิม (NPPool)

- **ที่มา:** `C:\Projects\NPPool` บนเครื่องผู้ใช้ (ไม่ใช่ git repo · ไม่ได้นำขึ้น GitHub) — ซอร์สแก้ไขล่าสุด 2026-06-28 · ดูเพิ่มเฉพาะรายการไฟล์และรูปแบบ config ของสำเนาที่ publish ไว้ที่ `C:\inetpub\wwwroot\NPPOOL`
- **วันที่สำรวจ:** 2026-11-26 · ผู้สำรวจ: Claude Code (เซสชันบนเครื่องผู้ใช้)
- **วิธีสำรวจ:** อ่านไฟล์อย่างเดียว — ไม่ build, ไม่รันแอป, ไม่คัดลอกไฟล์งานเดิมเข้า repo · ฐานข้อมูล: รันสคริปต์ SELECT อย่างเดียวด้วย Windows authentication ตามที่ผู้ใช้อนุญาต (2026-11-26, หัวข้อ 8.0)
- **สถานะ:** ✅ อนุมัติแล้ว 2026-11-26 → ขั้นที่ 2 (Analysis) · เอกสารนี้อัปเดตผลฐานข้อมูลจริงและคำตอบ Q1–Q3 แล้ว
- **การอ้างอิงไฟล์:** path นับจากโฟลเดอร์โปรเจกต์ `C:\Projects\NPPool\NPPool\` (เช่น `Controllers/HomeController.cs:35`); ไฟล์ระดับบนสุดของโฟลเดอร์งานเดิมขึ้นต้นด้วย `../` (เช่น `../Gemini_NPPOOL.txt`)

> เอกสารนี้อยู่ใน repo สาธารณะ: ไม่มีค่าความลับ ชื่อเครื่อง ชื่อลูกค้า หรือข้อมูลส่วนบุคคล — ความลับบอกเฉพาะตำแหน่ง (หัวข้อ 14)

---

## 1. สรุปสั้น

- **ระบบคืออะไร:** เว็บแอปภายในของ “NP Pool Group” (บริษัทรับขนส่งสินค้า) สำหรับ **สร้าง ดู ลบ และพิมพ์ใบงาน** (ใบรับ-ส่งสินค้า / ใบสั่งปฏิบัติงาน) และดูแล **ข้อมูลพื้นฐาน 4 ชุด**: ผู้ว่าจ้าง, รถ, พนักงานขับรถ, สถานที่รับ-ส่งพร้อมราคา
- **เทคโนโลยี:** ASP.NET Core 8 MVC (C#) + Dapper (เขียน SQL ตรง) + SQL Server ฐานข้อมูล `TCRMIS` schema `NPPOOL` · login ด้วย ASP.NET Core Identity แบบ custom store · PDF ด้วย Rotativa/wkhtmltopdf · deploy แบบ publish folder ไป IIS
- **ขนาด:** เล็ก — 6 controller (C# ที่เขียนเองราว 1,800 บรรทัด), 9 หน้าจอใช้งาน, 1 เอกสารพิมพ์, 12 ตาราง + 14 view, 3 บทบาท
- **ยังไม่มีในระบบเดิม:** ใบวางบิล/ตรวจใบวางบิล (มีเมนูแต่ลิงก์ว่าง), การเปลี่ยนสถานะงาน, dashboard/รายงานสรุป, งานตั้งเวลา, การเชื่อมต่อระบบภายนอก, ไฟล์อัปโหลด
- **ประเด็นสำคัญต่อการสร้างใหม่**
  1. ข้อความไทยเก็บใน `varchar` + collation `Thai_CI_AS` (code page 874) → ต้องแปลงเป็น UTF-8 ตอนย้ายข้อมูล
  2. เลขที่ใบงานใช้ปี **พ.ศ.** และ running number รายเดือน
  3. มีช่องโหว่ด้านสิทธิ์หลายจุด เช่น สมัครเป็น Admin เองได้ และหน้าสถานที่รับ-ส่งไม่ตรวจการ login (หัวข้อ 12)
  4. ไฟล์ `.sql` ในโฟลเดอร์เป็นฉบับร่างที่ไม่ตรงกับของจริง — ใช้ไฟล์ export `../Database/TCRMIS_Database.xlsx` เป็น schema หลัก
  5. ฐานข้อมูลจริงบนเครื่องนี้ (`TCRMIS` บน SQL Server 2025) มี schema `NPPOOL` **รุ่นเก่ากว่าซอร์ส** (ยังไม่มีตาราง `Location_From_To`) และ **ไม่มีใบงานเลย** — ข้อมูลพื้นฐานเป็นข้อมูลทดสอบอย่างละ 1 แถว · ไม่มี FK และมี PK เฉพาะตาราง `Users` (หัวข้อ 8.0)
  6. ระบบเดิม**ไม่ได้เปิดใช้งานแล้ว** (ผู้ใช้ยืนยัน 2026-11-26) → ใช้ซอร์สล่าสุด (2026-06-28) เป็นต้นแบบ รวมหน้าพิมพ์ PDF และหน้าสถานที่รับ-ส่ง ซึ่งไม่มีในสำเนา publish (build 2026-03-21)

## 2. ภาพรวม

| หัวข้อ | ค่า | หลักฐาน |
|---|---|---|
| ภาษา / เฟรมเวิร์ก / เวอร์ชัน | C# · ASP.NET Core MVC + Razor views บน .NET 8 (`net8.0`, nullable, implicit usings) · Visual Studio 2022 (17.14) | `NPPool.csproj`, `../NPPool.sln` |
| การเข้าถึงข้อมูล | Dapper 2.1.66 + Microsoft.Data.SqlClient 6.1.1 — SQL เขียนตรงใน controller; EF Core ติดตั้งไว้แต่ไม่ได้ใช้ (ไม่มี `AddDbContext`) | `Controllers/*.cs`, `Data/CustomUserStore.cs` |
| ระบบผู้ใช้ | ASP.NET Core Identity (`AddIdentityCore`) + custom user store บนตาราง `NPPOOL.Users` · cookie 30 นาทีแบบต่ออายุ · 3 บทบาท | `Program.cs:26-56`, `Data/CustomUserStore.cs`, `Services/CustomClaimsPrincipalFactory.cs` |
| เอกสาร PDF | Rotativa.AspNetCore 1.4.0 + wkhtmltopdf 0.12.6 (ไฟล์ .exe อยู่ใน `wwwroot/Rotativa`) | `Program.cs:88`, `Controllers/HomeController.cs:373-394` |
| Frontend | Bootstrap 5.1.0, jQuery 3.6.0, jQuery Validation 1.19.5 (ไฟล์ในเครื่อง) + CDN: Bootstrap Icons 1.10.5, Select2 4.1.0-rc.0, select2-bootstrap-5-theme 1.3.0, flatpickr (ไม่ระบุเวอร์ชัน) | `wwwroot/lib/`, `Views/Shared/_LayoutMain.cshtml:8-15,115`, `Views/Home/ManageWorkOrder.cshtml:148-149` |
| วิธีรัน | Dev: `dotnet run` profile `http` → `http://localhost:5069` · Production: Visual Studio Folder publish → `C:\inetpub\wwwroot\NPPOOL` → IIS แบบ in-process (หัวข้อ 5) | `Properties/launchSettings.json`, `Properties/PublishProfiles/FolderProfile.pubxml`, `../web.config` |
| ฐานข้อมูล | SQL Server · ฐานข้อมูล `TCRMIS` (ใช้ร่วมกับระบบอื่นที่ไม่เกี่ยวข้อง) · schema `NPPOOL` · collation `Thai_CI_AS` · export: 12 ตาราง + 14 view · ฐานข้อมูลในเครื่องนี้: SQL Server 2025, 11 ตาราง + 14 view | `appsettings*.json` (ชื่อฐานข้อมูล), `../Database/TCRMIS_Database.xlsx`, หัวข้อ 8.0 |
| ขนาด | ทั้งโฟลเดอร์ 794 ไฟล์ / 272 MB (bin+obj 204 MB, wkhtmltopdf 58 MB) · ซอร์สที่ build: C# 38 ไฟล์ 2,665 บรรทัด (ไม่รวม migration และไฟล์ `.cshtml.cs` เปล่า: 25 ไฟล์ 1,773 บรรทัด), Razor 20 ไฟล์ 1,351 บรรทัด · ไฟล์สำรองนอกโปรเจกต์ ~2,100 บรรทัด · ตาราง 12 + view 14 · **ข้อมูล:** ใบงาน 0, ข้อมูลพื้นฐานอย่างละ 1 แถว, ข้อมูลอ้างอิง ~7,500 แถว (schema ใช้พื้นที่ 1.8 MB) | นับด้วย `find`/`wc` และสคริปต์ 2026-11-26 |
| ประวัติการพัฒนา | เริ่ม 2025-09-22 (template) → แก้ล่าสุด 2026-06-28 · publish 23 ครั้ง สำเร็จ 22 (2025-11-16 ถึง 2026-03-22) · ไม่มี git · requirement สั่งงานผ่าน Gemini | วันที่ไฟล์, `Properties/PublishProfiles/FolderProfile.pubxml.user`, `../Gemini_NPPOOL.txt` |

## 3. โครงสร้างไฟล์ (ระดับบน)

```text
C:\Projects\NPPool\
├─ NPPool.sln                         solution มี 1 โปรเจกต์
├─ web.config                         web.config สำหรับ IIS (เพิ่ม requestLimits 8192)
├─ Database\TCRMIS_Database.xlsx      ★ export schema จริง: INFORMATION_SCHEMA.COLUMNS 187 แถว + นิยาม view 14 ตัว
├─ Gemini_NPPOOL.txt                  ★ บันทึก requirement ที่ผู้พัฒนาสั่ง Gemini ทีละรอบ (ประวัติ requirement)
├─ SQLQuery1-4.sql                    สคริปต์สร้างตาราง/view ฉบับร่าง — เก่ากว่าของจริง (หัวข้อ 8.5)
├─ *_2025xxxx.cshtml, *.cshtml,       ไฟล์สำรองฉบับเก่า (ไม่อยู่ในโปรเจกต์ ไม่ถูก build)
│  HomeController.cs, Login_cshtml.txt
├─ NPPool-Logo.gif
├─ .vs\                               cache ของ Visual Studio (รวมดัชนี Copilot)
└─ NPPool\                            ★ โปรเจกต์ที่ build จริง
   ├─ Program.cs                      DI, Identity, cookie, pipeline, Rotativa
   ├─ NPPool.csproj (+ .user)
   ├─ appsettings.json, appsettings_dev.json, appsettings_server.json, appsettings.Development.json
   ├─ Controllers\                    Account, Home (ใบงาน), Customer, Employee, Vehicle, Location
   ├─ Models\                         entity + view model 15 ไฟล์
   ├─ Data\                           CustomUserStore (Dapper) · ApplicationDbContext + Migrations (ไม่ได้ใช้)
   ├─ Services\                       CustomClaimsPrincipalFactory (ใส่ role + ชื่อ-นามสกุลใน claim)
   ├─ Views\                          Razor views + ไฟล์ .cshtml.cs เปล่า 10 ไฟล์
   ├─ Areas\Identity\Pages\           เหลือแค่ _ViewStart (ซากจาก template)
   ├─ Properties\                     launchSettings, PublishProfiles (FileSystem → C:\inetpub\wwwroot\NPPOOL)
   ├─ wwwroot\                        css, images, lib, Rotativa (wkhtmltopdf.exe + ตัวติดตั้ง)
   ├─ *.txt                           สำเนา Program.cs / AccountController.cs ฉบับเก่า
   ├─ .config\dotnet-tools.json       dotnet-ef 10.0.5
   └─ bin\, obj\                      ผล build (Debug, Release)
```

## 4. Dependencies

### 4.1 NuGet (`NPPool.csproj`)

| แพ็กเกจ | เวอร์ชัน | ใช้จริง? |
|---|---|---|
| Dapper | 2.1.66 | ✅ query ทั้งหมด |
| Microsoft.Data.SqlClient | 6.1.1 | ✅ |
| Microsoft.AspNetCore.Identity.EntityFrameworkCore | 8.0.19 | บางส่วน — ใช้ type ของ Identity, ไม่ได้ใช้ EF store |
| Microsoft.AspNetCore.Identity.UI | 8.0.19 | ❌ ไม่ได้ใช้หน้า UI สำเร็จรูป |
| Microsoft.EntityFrameworkCore.SqlServer / .Tools / Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore | 8.0.19 | ❌ (เหลือจาก template) |
| Rotativa.AspNetCore | 1.4.0 | ✅ สร้าง PDF |
| (tool) dotnet-ef | 10.0.5 | ❌ |

### 4.2 Frontend

| ไลบรารี | เวอร์ชัน | ที่มา |
|---|---|---|
| Bootstrap | 5.1.0 | `wwwroot/lib/bootstrap` |
| jQuery | 3.6.0 | `wwwroot/lib/jquery` |
| jQuery Validation + Unobtrusive | 1.19.5 | `wwwroot/lib/jquery-validation*` |
| Bootstrap Icons | 1.10.5 | CDN jsDelivr |
| Select2 + select2-bootstrap-5-theme | 4.1.0-rc.0 / 1.3.0 | CDN jsDelivr |
| flatpickr (ปฏิทิน + เวลา 24 ชม.) | **ไม่ระบุ** (ดึงล่าสุดทุกครั้ง) | CDN jsDelivr |

## 5. วิธีรันและสภาพแวดล้อม

- **Development:** เปิดใน Visual Studio 2022 หรือ `dotnet run --launch-profile http` (`ASPNETCORE_ENVIRONMENT=Development`) → `http://localhost:5069` (profile https: `https://localhost:7100`) · ต้องมี .NET 8 (เครื่องนี้มี runtime 8.0.20 และ SDK 9.0.305)
- **การเลือก config:** แอปโหลดเฉพาะ `appsettings.json` + `appsettings.{Environment}.json` ตามค่าตั้งต้นของ ASP.NET Core — ไฟล์ `appsettings_dev.json` / `appsettings_server.json` **ไม่ถูกโหลดอัตโนมัติ** จึงน่าจะเป็นแม่แบบที่คัดลอกทับ `appsettings.json` เองตอน deploy (`Program.cs` ไม่มี `AddJsonFile`)
- **Production:** Folder publish → `C:\inetpub\wwwroot\NPPOOL` → IIS ผ่าน AspNetCoreModuleV2 แบบ in-process (ต้องมี .NET 8 Hosting Bundle) · `../web.config` เพิ่ม `maxQueryString`/`maxUrl` = 8192
- **อินเทอร์เน็ต / reverse proxy:** ตั้ง Forwarded Headers ให้เชื่อทุก proxy และมีคอมเมนต์ cookie domain บน Cloudflare `*.workers.dev` → เคยหรือกำลังเปิดใช้ผ่าน Cloudflare (`Program.cs:13-23,50`, `Program_cs.txt:49`) → Q1
- **สิ่งที่พบบนเครื่องนี้ (2026-11-26):** มี IIS ทำงานอยู่ แต่ไม่มี site ใดชี้ไปที่โฟลเดอร์ `NPPOOL` · ฐานข้อมูล `TCRMIS` ที่ใช้ได้อยู่บน **default instance (SQL Server 2025)** · named instance (SQL Server 2022) ที่ `appsettings.json` ชี้ไปถูกปิดและไม่มีไฟล์ฐานข้อมูล `TCRMIS` ในโฟลเดอร์ข้อมูลของมัน · สำเนา publish เป็น build 2026-03-21 ซึ่ง **ไม่มี** `LocationController` และหน้า `PrintWorkOrder` (ตรวจจากชื่อ type ใน `NPPool.dll`) ขณะที่ build ล่าสุดในเครื่อง (2026-06-28) มีครบ · ผู้ใช้ยืนยันว่าระบบไม่ได้เปิดใช้งานแล้ว (Q1)

### 5.1 ไฟล์ config และฐานข้อมูลที่ชี้ไป (ไม่แสดงค่า)

| ไฟล์ | ถูกโหลดเมื่อ | ฐานข้อมูล | การยืนยันตัวตน | หมายเหตุ |
|---|---|---|---|---|
| `appsettings.json` (2026-06-28) | ทุก environment | `TCRMIS` บน named instance ของเครื่องนี้ (ปัจจุบันถูกปิด) | SQL login บัญชีผู้ดูแลระบบในตัว + รหัสผ่าน | ส่วนแรกของ connection string **ไม่มีคีย์ `Server=`** — ถ้าใช้ไฟล์นี้น่าจะเชื่อมต่อไม่ได้ |
| `appsettings_dev.json` | ไม่ถูกโหลดอัตโนมัติ | `TCRMIS` บนอีกเครื่องหนึ่ง | เหมือนข้างบน (รหัสผ่านเดียวกัน) | |
| `appsettings_server.json` | ไม่ถูกโหลดอัตโนมัติ | `TCRMIS` บนเครื่อง server | เหมือนข้างบน (รหัสผ่านเดียวกัน) | |
| `appsettings.Development.json` | Development | — | — | มีแค่ logging |
| `C:\inetpub\wwwroot\NPPOOL\appsettings.json` (2026-03-14) | สำเนาที่ publish | `TCRMIS` | Windows Integrated Security (ไม่มีรหัสผ่าน) | |
| `C:\inetpub\wwwroot\NPPOOL\appsettings_NPPOOL.json` | ไม่ถูกโหลดอัตโนมัติ | `TCRMIS` | ไม่ระบุ | มีเฉพาะในสำเนาที่ publish |
| `bin/{Debug,Release}/net8.0/appsettings*.json` | ผล build | สำเนาของไฟล์ข้างบน | | `bin/Debug` มี `appsettings.json` ฉบับเก่ากว่า |

## 6. หน้าจอ / เมนู

เมนูด้านข้าง (`Views/Shared/_LayoutMain.cshtml:24-87`) — เมนูซ่อนตามบทบาท แต่การตรวจสิทธิ์จริงอยู่ที่ controller (ดูคอลัมน์ “สิทธิ์ที่บังคับจริง”)

```text
จัดการงาน
├─ สร้างใบงาน            Maker, Admin
├─ รายการใบงาน           Maker, Admin
├─ สร้างใบวางบิล          Maker, Admin      ← ลิงก์ "#" ยังไม่ทำ
└─ ตรวจใบวางบิล          Accounting, Admin ← ลิงก์ "#" ยังไม่ทำ
ข้อมูลพื้นฐาน (Admin)
├─ ข้อมูลผู้ว่าจ้าง
├─ ข้อมูลรถ
├─ ข้อมูลพนักงานขับรถ
└─ ข้อมูลสถานที่รับ-ส่ง
```

| # | หน้าจอ | ไฟล์ | ทำอะไร | ใครใช้ (สิทธิ์ที่บังคับจริง) |
|---|---|---|---|---|
| 1 | Login + สมัครสมาชิก | `Views/Account/Login.cshtml`, `Controllers/AccountController.cs` | Login (Username, Password, Remember me) · ฟอร์มสมัคร (Username, ชื่อ, นามสกุล, เบอร์, รหัสผ่าน, **เลือกบทบาทเอง**) → สมัครแล้ว login ทันที → ไป Dashboard | ทุกคน ไม่ต้อง login |
| 2 | Dashboard | `Views/Home/NPPage1.cshtml` | ข้อความต้อนรับอย่างเดียว | ผู้ที่ login |
| 3 | สร้างใบงาน / ดูใบงาน | `Views/Home/ManageWorkOrder.cshtml`, `HomeController.cs:35-214` | ฟอร์ม 5 ส่วน: **ผู้ว่าจ้าง** (ผู้ว่าจ้าง, สถานะงาน, ผู้สั่งงาน) · **สถานที่รับ-ส่ง** (สถานที่รับ/ส่งแบบพิมพ์ค้นหาได้ เลือกฝั่งหนึ่งแล้วเติมอีกฝั่งให้, ชื่อผู้ติดต่อ+เบอร์ทั้งสองฝั่ง, ค่าขนส่ง) · **รถและการขนส่ง** (หลายแถว: ประเภทรถ, พขร., ทะเบียน, เบอร์ พขร. ดึงอัตโนมัติ, จำนวน, น้ำหนัก, ขนาด) · **ข้อมูลงาน** (วัน-เวลารับงาน/ส่งงาน, Job No./Shipment, Remark) · **ค่าใช้จ่ายเพิ่มเติม** (ค่าผ่านท่า, ค่าเสียเวลา, จำนวนคืน 0-15, ค่าแรงค้างคืน, จำนวนคน 0-15, ค่าแรงคน) · เลขที่ใบงานสร้างอัตโนมัติตอนบันทึก · เปิดใบงานเดิม = อ่านอย่างเดียว | เปิดหน้า: Maker, Admin · บันทึก: **ทุกบทบาท** ที่ login |
| 4 | รายการใบงาน | `Views/Home/WorkOrderList.cshtml`, `HomeController.cs:340-370` | ตาราง 13 คอลัมน์ (สถานะ, เลขที่, ผู้ว่าจ้าง, ผู้สั่งงาน, สถานที่รับ/ส่ง, ประเภทรถ, พขร., ทะเบียน, วันที่รับ/ส่ง, ราคา, ปุ่ม) หน้าละ 50 แถว ใหม่→เก่า · ปุ่ม แก้ไข (= เปิดดู) / ลบ (ยืนยันก่อน) / พิมพ์ | ทุกบทบาทที่ login |
| 5 | ใบสั่งปฏิบัติงาน (PDF) | `Views/Home/PrintWorkOrder.cshtml`, `HomeController.cs:373-394` | ดูหัวข้อ 9 | ทุกบทบาทที่ login |
| 6 | ข้อมูลผู้ว่าจ้าง | `Views/Customer/Index.cshtml`, `Controllers/CustomerController.cs` | ฟอร์ม (ชื่อบริษัท, เบอร์โทร, ที่อยู่, เลขประจำตัวผู้เสียภาษี — บังคับทุกช่อง) + รายการเลื่อนดูได้ แก้ไข/ลบ | Admin |
| 7 | ข้อมูลรถ | `Views/Vehicle/Index.cshtml`, `Controllers/VehicleController.cs` | ฟอร์ม (ทะเบียน, ประเภทรถ) + รายการ แก้ไข/ลบ | Admin |
| 8 | ข้อมูลพนักงานขับรถ | `Views/Employee/Index.cshtml`, `Controllers/EmployeeController.cs` | ฟอร์ม (ชื่อ, นามสกุล, เบอร์) + รายการ แก้ไข/ลบ | Admin |
| 9 | ข้อมูลสถานที่รับ-ส่ง | `Views/Location/Index.cshtml`, `Controllers/LocationController.cs` | ฟอร์ม (สถานที่รับ, สถานที่ส่ง, ราคา) + รายการ แก้ไข/ลบ · ใช้ layout ตั้งต้น (ไม่มีเมนูด้านข้าง) | ⚠️ **ไม่ตรวจสิทธิ์** — เข้าได้โดยไม่ login |
| — | หน้าจาก template | `Views/Home/Index.cshtml`, `Privacy.cshtml`, `Shared/Error.cshtml`, `Shared/_Layout.cshtml`, `_LoginPartial.cshtml` | Index redirect ไป Dashboard; ที่เหลือไม่ได้ใช้ | — |

### 6.1 Endpoint ทั้งหมด (route แบบ convention `{controller=Home}/{action=Index}/{id?}`)

| Method | Path | ทำอะไร | สิทธิ์ที่บังคับจริง | หลักฐาน |
|---|---|---|---|---|
| GET | `/Account/Login` | หน้า login | ไม่ต้อง login | `AccountController.cs:26-39` |
| POST | `/Account/Login` | ตรวจรหัสผ่าน → ไป `/Home/NPPage1` | ไม่ต้อง login + antiforgery | `AccountController.cs:42-61` |
| POST | `/Account/Logout` | ออกจากระบบ | ไม่ตรวจ antiforgery | `AccountController.cs:63-69` |
| POST | `/Account/Register` | สร้างผู้ใช้ + login | ไม่ต้อง login + antiforgery | `AccountController.cs:71-103` |
| ทุก method | `/Account/Register_notuse` | สร้างผู้ใช้ (ฉบับเก่า ยังเป็น public action) | ⚠️ ไม่ต้อง login, ไม่ตรวจ antiforgery | `AccountController.cs:105-130` |
| GET | `/Home/ManageWorkOrder/{id?}` | ฟอร์มสร้าง / เปิดดูใบงาน | Maker, Admin | `HomeController.cs:35-68` |
| POST | `/Home/ManageWorkOrder` | บันทึกใบงาน + รายการรถ | ⚠️ login (ทุกบทบาท) + antiforgery | `HomeController.cs:71-214` |
| GET | `/Home/GetPickupDropoffLocations` | คู่สถานที่รับ-ส่ง (JSON) | login | `HomeController.cs:289-310` |
| GET | `/Home/GetDriverInfo?driverId=` | เบอร์ พขร. (JSON) | login | `HomeController.cs:326-337` |
| GET | `/Home/GetDistricts`, `/GetTambons`, `/GetPostcodes`, `/GetDriverInfo_notuse` | อำเภอ/ตำบล/รหัสไปรษณีย์ (JSON) — หน้าจอปัจจุบันไม่เรียกแล้ว | login | `HomeController.cs:255-286,313-324` |
| GET | `/Home/WorkOrderList?page=` | รายการใบงาน | login | `HomeController.cs:340-370` |
| GET | `/Home/PrintWorkOrder/{id}` | PDF ใบสั่งปฏิบัติงาน | login | `HomeController.cs:373-394` |
| POST | `/Home/DeleteWorkOrder` | ลบใบงาน + รายการรถ | ⚠️ login (ทุกบทบาท) + antiforgery | `HomeController.cs:397-427` |
| GET | `/Home/Index`, `/Home/NPPage1`, `/Home/Privacy` · `/Home/Error` | หน้าทั่วไป | login · Error ไม่ต้อง login | `HomeController.cs:429-453` |
| GET / POST | `/Customer` · `/Customer/Save` · `/Customer/Delete` · `/Customer/GetCustomer?id=` | CRUD ผู้ว่าจ้าง | Admin (+ antiforgery ที่ POST) | `CustomerController.cs:12-97` |
| GET / POST | `/Employee` · `/Employee/Save` · `/Employee/Save_notuse` · `/Employee/Delete` · `/Employee/GetEmployee?id=` | CRUD พนักงานขับรถ | Admin (+ antiforgery ที่ POST) | `EmployeeController.cs:10-149` |
| GET / POST | `/Vehicle` · `/Vehicle/Save` · `/Vehicle/Save_notuse` · `/Vehicle/Delete` · `/Vehicle/GetVehicle?id=` | CRUD รถ | Admin (+ antiforgery ที่ POST) | `VehicleController.cs:11-227` |
| GET / POST | `/Location` · `/Location/Save` · `/Location/Delete` | CRUD สถานที่รับ-ส่ง + ราคา | ⚠️ **ไม่มี** (ไม่ต้อง login, ไม่ตรวจ antiforgery) | `LocationController.cs:8-49` |

### 6.2 ผู้ใช้และบทบาท (เบื้องต้น — ทำ role matrix ละเอียดในขั้นที่ 2)

- ตาราง `NPPOOL.Users`: Username, PasswordHash (รูปแบบ hash ของ ASP.NET Core Identity), FirstName, LastName, Tel, RoleType — ผู้ใช้ 1 คนมี 1 บทบาท (เก็บเป็นข้อความ)
- บทบาทในโค้ด: **Admin, Maker, Accounting** (`Views/Account/Login.cshtml:66-71`, `_LayoutMain.cshtml`) · requirement รอบแรกระบุ Admin / User / GL (`../Gemini_NPPOOL.txt:28`) → Q5
- นโยบายรหัสผ่าน: ค่าตั้งต้นของ Identity เพราะไม่ได้ตั้งค่าเพิ่ม (`Program.cs:26-28`) — ยาวอย่างน้อย 6 ตัว มีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์
- Session: cookie `.NPPOOL.Auth` อายุ 30 นาทีแบบต่ออายุเมื่อใช้งาน, “Remember me” = cookie แบบถาวร, ไม่มี lockout เมื่อใส่รหัสผิด (`Program.cs:40-56`, `AccountController.cs:50`)
- Claim: บทบาทจาก RoleType และชื่อ-นามสกุล (`Services/CustomClaimsPrincipalFactory.cs`) · คอลัมน์ `CreatedBy` / `ModifiedBy` ทุกตารางเก็บ `User.Identity.Name` (ชื่อผู้ใช้ที่ login)

## 7. เทียบกับเช็กลิสต์งานขนส่ง (skill.md หัวข้อ 3)

| สิ่งที่มักพบ | ในระบบเดิม | หลักฐาน |
|---|---|---|
| ลูกค้า | ✅ ผู้ว่าจ้าง (`Customers`) | หน้าจอ 6 |
| ผู้ส่ง-ผู้รับ | ✅ ชื่อผู้ติดต่อ + เบอร์ ฝั่งรับและฝั่งส่ง (คอลัมน์ในใบงาน ไม่ใช่ master) | `WorkOrders.PickerUser/PickerTel/DropoffUser/DropoffTel` |
| ใบงาน / ใบสั่งขนส่ง | ✅ ใบงาน + รายการรถ + PDF | หน้าจอ 3–5 |
| รถ | ✅ ทะเบียน, ประเภท (ยี่ห้อถูกเอาออกจากฟอร์มแล้ว) | หน้าจอ 7 |
| คนขับ | ✅ พนักงานขับรถ (`Employee`) | หน้าจอ 8 |
| เส้นทาง | 🟨 เป็นคู่ “สถานที่รับ → สถานที่ส่ง” แบบข้อความ | `Location_From_To` |
| อัตราค่าขนส่ง | 🟨 มีราคาต่อคู่สถานที่ แต่ไม่ถูกนำไปใช้ในใบงาน (ค่าขนส่งกรอกเอง) | Q12 |
| สถานะการขนส่ง | 🟨 มี 8 สถานะ แต่ไม่มีหน้าจอเปลี่ยนสถานะ | Q10 |
| หลักฐานการส่ง (รูป/ลายเซ็น) | ❌ ไม่มี | — |
| ใบแจ้งหนี้ / ใบวางบิล / ใบเสร็จ | ❌ มีแค่เมนูว่าง | Q11 |

## 8. ตาราง / แหล่งข้อมูล

แหล่งหลัก: `../Database/TCRMIS_Database.xlsx` (วันที่ไฟล์ 2026-06-28) — ชีต `Table` = export ของ `INFORMATION_SCHEMA.COLUMNS` (187 คอลัมน์ จาก 26 object), ชีต `View` = นิยาม view 14 ตัว · ตรวจเทียบกับ SQL ในโค้ดทุกจุดแล้ว: ชื่อตาราง/คอลัมน์ที่โค้ดใช้มีอยู่ใน export ครบ · PK/FK/จำนวนแถวได้จากฐานข้อมูลจริง (หัวข้อ 8.0)

### 8.0 ผลสำรวจฐานข้อมูลจริง (`TCRMIS` บนเครื่องนี้ · 2026-11-26)

รันด้วย [`sql/01-inventory-readonly.sql`](sql/01-inventory-readonly.sql) (SELECT อย่างเดียว, Windows authentication ตามที่ผู้ใช้อนุญาต) — ผลดิบเก็บไว้นอก repo

| หัวข้อ | ผล |
|---|---|
| Server | SQL Server 2025 (17.0) Developer Edition · default instance · compatibility level 160 · collation `Thai_CI_AS` |
| ฐานข้อมูล | `TCRMIS` ใช้ร่วมกับระบบอื่นอีก 40 schema ที่ไม่เกี่ยวกับ NPPool (ไม่บันทึกชื่อ) → ระบบใหม่ใช้เฉพาะ schema `NPPOOL` · `NPPOOL` ใช้พื้นที่ 1.8 MB |
| เทียบกับ export | 11 ตาราง (ไม่มี `Location_From_To`) + 14 view · view `Lookup_Driver` ไม่มีคอลัมน์ `Tel` · คอลัมน์อื่นตรงกับ export ทุกตัว → **export ใหม่กว่าฐานข้อมูลนี้** (มาจากฐานข้อมูลอีกชุดที่ไม่มีในเครื่องนี้แล้ว) และโค้ดล่าสุดต้องใช้ schema ตาม export |
| คีย์และข้อจำกัด | มีแค่ `Users`: PK (`Id`) + UNIQUE (`Username`) · ตารางอื่น **ไม่มี PK, ไม่มี FK, ไม่มี default/check, ไม่มี index** · ไม่มี trigger / procedure / function · ไม่มี SQL Agent job |
| จำนวนแถว | `WorkOrders` 0 · `WorkOrderDetails` 0 · `Customers` 1 · `Employee` 1 · `Vehicles` 1 · `Users` 1 (บทบาท Admin, hash แบบ Identity V3) · `Lookup_PickDropLocation` 1 · `WorkFlow_Status` 8 · `VehicleTypes` 14 · `VehicleBrand` 37 · `Master_DOPA` 7,436 |
| ร่องรอยการใช้งาน | ข้อมูลพื้นฐานทั้ง 3 แถวสร้างวันเดียวกัน (2025-10-01) · identity ล่าสุด: Customers 3, Vehicles 4, WorkOrderDetails 2, WorkOrders ยังไม่เคยมีแถว → **เป็นข้อมูลทดสอบ ไม่มีข้อมูลธุรกรรมจริง** |
| ค่าอ้างอิง | สถานะงาน 8 ค่า (หัวข้อ 8.4) · ประเภทรถ 14 ค่าเป็น **ประเภทรถยนต์นั่ง** (Sedan, Hatchback, SUV, …, EV, Hybrid) ไม่ใช่ประเภทรถบรรทุก · ยี่ห้อรถ 37 ค่าเป็นยี่ห้อรถยนต์ทั่วไป → ทั้งสองชุดน่าจะเป็นข้อมูลตัวอย่าง (Q22) · `Master_DOPA`: 77 จังหวัด, 928 อำเภอ, 7,436 ตำบล, 965 รหัสไปรษณีย์ |
| การเข้ารหัสไทย | อักษรไทยใน DOPA/ประเภทรถ/ข้อมูลทดสอบอ่านได้ถูกต้อง · ชื่อยี่ห้อ 1 ใน 37 มี `?` แทนอักษรละตินที่มีเครื่องหมาย (อยู่นอก code page 874) → **อักขระสูญหายไปแล้วจริง** |
| ผลต่อขั้นที่ 6 | ไม่มีข้อมูลธุรกรรมให้ย้าย → เสนอเริ่มระบบใหม่ด้วยข้อมูลอ้างอิงเท่านั้น (Q25) |

### 8.1 ตาราง (12)

| ตาราง | คอลัมน์ | ใช้ทำอะไร | ใช้โดย | หมายเหตุ |
|---|---|---|---|---|
| `WorkOrders` | 36 | หัวใบงาน | `HomeController` | เลขที่ใบงาน `varchar(50)`, ผู้ว่าจ้าง, สถานะ, สถานที่รับ/ส่ง (ข้อความ), id จังหวัด/อำเภอ/ตำบล/ไปรษณีย์ (ไม่ได้ใช้แล้ว), ผู้ติดต่อ, วันที่รับ/ส่ง **`date`**, `JobTime`/`Mileage` (เอาออกจากฟอร์มแล้ว), เงินทุกช่อง `decimal(18,2)`, `Overhead` `int`, audit · model C# (`Models/WorkOrder.cs`) ยังมี `VehicleId`/`VehicleTypeId`/`DriverId`/`DriverTel` แต่**ตารางไม่มีแล้ว** (ย้ายไป `WorkOrderDetails`) |
| `WorkOrderDetails` | 11 | รายการรถในใบงาน (1 ใบงานหลายคัน) | `HomeController` | ประเภทรถ, พขร., รถ, เบอร์ พขร. `varchar(20)`, จำนวน **`int`**, หน่วยจำนวน, ขนาด, น้ำหนัก **`decimal(10,2)`**, หน่วยน้ำหนัก |
| `Customers` | 9 | ผู้ว่าจ้าง | `CustomerController`, `Lookup_Customers` | ชื่อบริษัท, ที่อยู่, เบอร์, เลขประจำตัวผู้เสียภาษี (คอลัมน์ชื่อ `IDCard`), audit เป็น `date` |
| `Employee` | 11 | พนักงานขับรถ | `EmployeeController`, `Lookup_Driver` | รหัสพนักงาน, ชื่อ, นามสกุล, ที่อยู่, เบอร์, **เลขบัตรประชาชน** (ข้อมูลอ่อนไหว), audit |
| `Vehicles` | 10 | รถ | `VehicleController`, `Lookup_VehiclePlate` | ทะเบียน, `VehicleTypeId` + `VehicleType` (เก็บชื่อประเภทซ้ำ), `VehicleBrandId`, `Name` (ไม่ได้ใช้), audit |
| `VehicleTypes` | 7 | ประเภทรถ | dropdown | `VehicleType` (รหัส) + `VehicleName` (ชื่อ) — **ไม่มีหน้าจอจัดการ** |
| `VehicleBrand` | 6 | ยี่ห้อรถ | dropdown (ถูกเอาออกจากฟอร์มแล้ว) | ไม่มีหน้าจอจัดการ |
| `Location_From_To` | 6 | คู่สถานที่รับ → ส่ง + ราคา `numeric(20,2)` | `LocationController`, dropdown ในใบงาน | ราคายังไม่ถูกใช้ (Q12) |
| `Lookup_PickDropLocation` | 3 | คู่สถานที่รับ-ส่งรุ่นก่อน | ไม่มีโค้ดใช้แล้ว | Q23 |
| `WorkFlow_Status` | 2 | สถานะงาน (`Code`, `Description`) | dropdown | หัวข้อ 8.4 |
| `Users` | 7 | ผู้ใช้ระบบ | `Data/CustomUserStore.cs` | `Username varchar(256)`, `PasswordHash varchar(max)`, `RoleType varchar(50)` |
| `Master_DOPA` | 20 | เขตการปกครอง (ตำบล/อำเภอ/จังหวัด/ภาค/รหัสไปรษณีย์) ของกรมการปกครอง | view `Lookup_*` / `Master_*` | ข้อมูลสาธารณะ · ไม่ได้ใช้ในฟอร์มปัจจุบัน |

### 8.2 View (14)

| View | มาจาก | ใช้โดย |
|---|---|---|
| `WorkOrder_List` | `WorkOrders` ⟕ `WorkFlow_Status`, `Customers`, `WorkOrderDetails`, `VehicleTypes`, `Employee`, `Vehicles` | รายการใบงาน, PDF — ⚠️ ได้ **1 แถวต่อรถ 1 คัน** (F4) |
| `Lookup_Customers` | `Customers` (Id, Name) | dropdown ผู้ว่าจ้าง |
| `Lookup_WF_Status` | `WorkFlow_Status` | dropdown สถานะงาน |
| `Lookup_VahicleTypeName` (สะกด *Vahicle*) | `VehicleTypes` | dropdown ประเภทรถในใบงาน |
| `Lookup_VehicleTypes` | `VehicleTypes` | ไม่ได้ใช้แล้ว (ซ้ำกับตัวบน) |
| `Lookup_Driver` | `Employee` (ชื่อ + นามสกุล, Tel) | dropdown พขร. + เบอร์อัตโนมัติ |
| `Lookup_VehiclePlate` | `Vehicles` (ทะเบียน) | dropdown ทะเบียน |
| `Lookup_Province`, `Lookup_District`, `Lookup_Tambon`, `Lookup_Postcode` | `Master_DOPA` | จังหวัดถูกโหลดแต่ไม่แสดง; API อำเภอ/ตำบล/ไปรษณีย์ไม่ถูกเรียก |
| `Master_Province`, `Master_District`, `Master_Tambon` | `Master_DOPA` | ไม่มีโค้ดใช้ |

> metadata ของ `WorkOrder_List` ยังเป็น `nvarchar` ในบางคอลัมน์ ขณะที่ตาราง `WorkOrders` เป็น `varchar` แล้ว → ตารางเคยถูกเปลี่ยนชนิดหลังสร้าง view (ตรงกับ `../SQLQuery3.sql` ที่สร้างเป็น `nvarchar`)

### 8.3 ความสัมพันธ์ (อนุมานจาก join ในโค้ดและ view — ฐานข้อมูลจริงไม่มี FK เลย ยืนยันแล้ว)

- `WorkOrders.CustomerId` → `Customers.Id`
- `WorkOrders.WorkStatusId` → `WorkFlow_Status.Code`
- `WorkOrderDetails.WorkOrderId` → `WorkOrders.Id` (โค้ดลบรายการรถก่อนลบใบงาน)
- `WorkOrderDetails.VehicleTypeId` → `VehicleTypes.Id` · `.DriverId` → `Employee.Id` · `.VehicleId` → `Vehicles.Id`
- `Vehicles.VehicleTypeId` → `VehicleTypes.Id` · `Vehicles.VehicleBrandId` → `VehicleBrand.Id`
- `WorkOrders.PickupLocation` / `DropoffLocation` = **ข้อความ** ที่เลือกจาก `Location_From_To` (ไม่ใช่ FK — แก้ชื่อสถานที่ภายหลังใบงานเดิมไม่เปลี่ยน)
- `WorkOrders.*ProvinceId/DistrictId/TambonId/PostcodeId` (`int`) ↔ `Master_DOPA` (`varchar`) — ชนิดไม่ตรงกัน
- `Users` ไม่ผูกกับตารางอื่น นอกจากผ่านข้อความ `CreatedBy` / `ModifiedBy`

### 8.4 ค่าอ้างอิงที่เห็นในซอร์ส

- **สถานะงาน** (ฐานข้อมูลจริง, ยืนยันแล้ว): 1 เปิดใบงาน · 2 ยกเลิก · 3 พิมพ์ใบสั่งงาน · 4 จัดรถ · 5 ใส่ราคา · 6 เก็บเงินสด · 7 วางบิล · 8 ตรวจใบงาน — `../SQLQuery3.sql:109-123` เขียนสถานะ 1 ว่า “เปิดใบสมัครงาน” แต่ฐานข้อมูลแก้แล้ว
- **จำนวนคืน / จำนวนคน:** dropdown 0–15 (`ManageWorkOrder.cshtml:116,128`) — requirement ระบุ 1–15 (`../Gemini_NPPOOL.txt:194,196`)
- **ขนาดหน้า:** รายการใบงานหน้าละ 50 (`HomeController.cs:343`)

### 8.5 ไฟล์ `.sql` ในโฟลเดอร์ (ฉบับร่าง — อย่าใช้เป็น schema)

| ไฟล์ | เนื้อหา | ต่างจากของจริง |
|---|---|---|
| `../SQLQuery1.sql` | `WorkOrders` รุ่นแรก (เลข Job ของลูกค้า, Ref No, CS Name, Origin/Destination, AWB, สถานะแบบข้อความ) + FK | ถูกแทนที่ทั้งหมด — แต่ช่องเหล่านี้ตรงกับช่องที่ยังเป็น “-” ในใบพิมพ์ (Q17) |
| `../SQLQuery2.sql` | `Vehicles`, `Drivers`, `Customers`, `VehicleTypes` รุ่นแรก | ไม่มีตาราง `Drivers` ในของจริง (ใช้ `Employee`) |
| `../SQLQuery3.sql` | `Customers`, `Vehicles`, `VehicleTypes`, `Employee`, `WorkOrders` (`nvarchar`), `WorkFlow_Status` + 8 สถานะ | ของจริงเป็น `varchar`, เพิ่มผู้ติดต่อรับ/ส่ง, `Overhead`, `OverheadCost`, `Vehicles.VehicleBrandId/VehicleTypeId` |
| `../SQLQuery4.sql` | view `Lookup_*` / `Master_*` | ของจริงมีคอลัมน์เพิ่ม (`ProvinceID`, `DistrictId`, `TambonId`, `Tel`) |

### 8.6 ข้อมูลส่วนบุคคลที่อยู่ในฐานข้อมูล (ห้ามนำเข้า repo — ข้อมูลตัวอย่างต้องปิดบังก่อน)

| ตาราง | คอลัมน์ |
|---|---|
| `Customers` | ชื่อ, ที่อยู่, เบอร์, เลขผู้เสียภาษี (ถ้าเป็นบุคคลธรรมดา = เลขบัตรประชาชน) |
| `Employee` | ชื่อ-นามสกุล, ที่อยู่, เบอร์, เลขบัตรประชาชน |
| `Users` | ชื่อผู้ใช้, ชื่อ-นามสกุล, เบอร์, password hash |
| `WorkOrders`, `WorkOrderDetails` | ผู้สั่งงาน, ชื่อ+เบอร์ผู้ติดต่อรับ/ส่ง, เบอร์ พขร. |

## 9. รายงาน / เอกสารที่ออก

มีเอกสารเดียว: **ใบสั่งปฏิบัติงาน (PDF)** — ไม่มีรายงานสรุป หรือส่งออก Excel/CSV

| หัวข้อ | รายละเอียด | หลักฐาน |
|---|---|---|
| เปิดจาก | ปุ่มพิมพ์ในรายการใบงาน → `GET /Home/PrintWorkOrder/{id}` (แท็บใหม่) | `WorkOrderList.cshtml:55-57` |
| วิธีสร้าง | Rotativa `ViewAsPdf` → wkhtmltopdf · A4 แนวตั้ง · `--disable-smart-shrinking` · ชื่อไฟล์ `JobOrder_{เลขที่ใบงาน}.pdf` · ฟอนต์ Tahoma 14px | `HomeController.cs:386-392`, `PrintWorkOrder.cshtml:9-12` |
| ข้อมูล | 1 แถวจาก view `WorkOrder_List` | `HomeController.cs:379-380` |
| หัวกระดาษ | โลโก้ (ไฟล์ที่อ้างถึงไม่มีอยู่จริง) + หัวเรื่อง “ใบสั่งปฏิบัติงาน” | `PrintWorkOrder.cshtml:44-50` |
| ตารางหลัก | NP Job No · วันที่รับ · ประเภทรถ / เลข Job ของลูกค้ารายหนึ่ง (“-” ตายตัว) · เวลารับ (จากวันที่รับงาน) · พขร / Ref.No (“-”) · ทะเบียน / ผู้ว่าจ้าง / CS Name (“-”) | `PrintWorkOrder.cshtml:52-86` |
| กล่องต้นทาง / ปลายทาง | หัวกล่องสีเหลือง `#FFC000` · ต้นทาง = สถานที่รับ + ผู้ติดต่อ (ใช้ “ผู้สั่งงาน”) · ปลายทาง = สถานที่ส่ง + ผู้ติดต่อ (“-”) | `PrintWorkOrder.cshtml:88-100` |
| ไม่ได้พิมพ์ | ค่าขนส่ง/ค่าใช้จ่าย, จำนวน/น้ำหนัก/ขนาด, เบอร์โทร, Remark, Job No./Shipment, ผู้ติดต่อจริงของแต่ละฝั่ง | — |

## 10. การเชื่อมต่อภายนอก / งานตั้งเวลา / ไฟล์อัปโหลด

| เรื่อง | ผล | หลักฐาน |
|---|---|---|
| API / บริการภายนอก | ไม่พบ (ไม่มี `HttpClient`, อีเมล, SMS, การชำระเงิน) | ค้นทั้งโปรเจกต์ |
| งานตั้งเวลา | ไม่พบในแอป (ไม่มี `IHostedService` / timer) · ไม่มี SQL Agent job ของฐานข้อมูลนี้ (ยืนยันแล้ว) | สคริปต์ส่วนที่ 6 |
| ไฟล์อัปโหลด | ไม่มี (ไม่มี `IFormFile`) | ค้นทั้งโปรเจกต์ |
| ไฟล์ส่งออก | PDF ใบสั่งปฏิบัติงานเท่านั้น | หัวข้อ 9 |
| CDN ภายนอก | jsDelivr — โหลดทุกครั้งที่เปิดหน้า, flatpickr ไม่ล็อกเวอร์ชัน, ไม่มี SRI | `_LayoutMain.cshtml:8,12-13,115`, `ManageWorkOrder.cshtml:148-149` |
| Reverse proxy / อินเทอร์เน็ต | Forwarded Headers + ร่องรอย Cloudflare `*.workers.dev` | `Program.cs:13-23,50` → Q1 |
| การผูกชื่อฐานข้อมูล | view บางตัวอ้าง `[TCRMIS].[NPPOOL]...` แบบ 3 ส่วน | `Lookup_Customers`, `Lookup_VahicleTypeName` |

## 11. ภาษาไทย การเข้ารหัส และวันที่

- **ไฟล์ซอร์ส:** UTF-8 (บางไฟล์มี BOM) — อ่านภาษาไทยได้ปกติ
- **ฐานข้อมูล:** คอลัมน์ข้อความทั้งหมด (124 คอลัมน์) เป็น `varchar` collation `Thai_CI_AS` → เก็บเป็น **code page 874 (TIS-620 / Windows-874)** → ต้องแปลงเป็น UTF-8 ตอนย้ายข้อมูล และอักขระที่อยู่นอก code page 874 (เช่น emoji, ภาษาอื่น, อักษรละตินที่มีเครื่องหมาย) กลายเป็น `?` — **พบจริงแล้ว 1 แถว** ในตารางยี่ห้อรถ (หัวข้อ 8.0) · ระบบใหม่ต้องเก็บเป็น UTF-8
- **ปี พ.ศ.:** เลขที่ใบงานใช้ `DateTime.Now.Year + 543` (`HomeController.cs:93-97`)
- **วันเวลาที่บันทึก:** `GETDATE()` / `DateTime.Now` ตามเวลาเครื่อง server (น่าจะเป็นเวลาไทย) · ชนิด `date` / `datetime` ไม่มี timezone · audit ของข้อมูลพื้นฐานเป็น `date` (เวลาหาย)
- **การแสดงผล:** `ToString("dd/MM/yyyy HH:mm")` ใช้ culture ของเครื่อง server เพราะไม่ได้ตั้ง localization → ถ้า Windows ตั้งรูปแบบไทย ปีจะแสดงเป็น พ.ศ. และการอ่านวันที่จากฟอร์มอาจตีความปีผิด (Q26) · ฟอร์มใช้ flatpickr แสดง `d/m/Y H:i` (ค.ศ.)
- **ตัวเลขเงิน:** `decimal(18,2)` / `numeric(20,2)` · แสดง `N2` ในรายการใบงาน และ `N0` (ไม่มีทศนิยม) ในหน้าสถานที่รับ-ส่ง

## 12. ข้อสังเกตเบื้องต้น (ยืนยันและวิเคราะห์ต่อในขั้นที่ 2)

พบระหว่างอ่านโค้ด ยังไม่ได้ทดสอบกับระบบที่รันจริง — ใช้เป็นจุดตั้งต้นของ business rule และสิ่งที่ “ไม่ควรลอก” ไประบบใหม่

### 12.1 ความปลอดภัย

| ID | ข้อสังเกต | หลักฐาน | ผลต่อระบบใหม่ |
|---|---|---|---|
| S1 | ใครก็สมัครสมาชิกได้จากหน้า Login และเลือกบทบาท Admin เองได้ | `AccountController.cs:71-103`, `Login.cshtml:39-80` | ให้ Admin เป็นผู้สร้างบัญชี (Q6) |
| S2 | action ฉบับเก่า `Register_notuse` ยังเปิดอยู่ รับทุก HTTP method และไม่ตรวจ antiforgery | `AccountController.cs:105-130` | ไม่ยก action ที่ไม่ใช้ไปด้วย |
| S3 | หน้า Location ไม่มี `[Authorize]` และไม่ตรวจ antiforgery → แก้/ลบราคาได้โดยไม่ login | `LocationController.cs:8-49` | ปิดทุก route เป็นค่าเริ่มต้น (deny by default) |
| S4 | บันทึก/ลบ/ดู/พิมพ์ใบงาน บังคับแค่ “login แล้ว” — เมนูซ่อนตามบทบาทแต่เปิด URL ตรงได้ | `HomeController.cs:16,35,71-73,340,373,397` | role matrix ในขั้นที่ 2 |
| S5 | ต่อฐานข้อมูลด้วยบัญชีผู้ดูแลระบบสูงสุดของ SQL Server, รหัสผ่านเป็นข้อความล้วนใน config และใช้ค่าเดียวกันทุกสภาพแวดล้อม | หัวข้อ 14 | ใช้บัญชีสิทธิ์จำกัด + Environment Variables; แนะนำเปลี่ยนรหัสผ่านของระบบเดิม |
| S6 | ไม่มี lockout เมื่อใส่รหัสผิดซ้ำ | `AccountController.cs:50` | จำกัดจำนวนครั้ง / lockout |
| S7 | Forwarded Headers เชื่อทุก proxy (ล้าง KnownProxies/KnownNetworks) | `Program.cs:13-23` | — |
| S8 | `wkhtmltopdf.exe` และตัวติดตั้งอยู่ใน `wwwroot` → ใครก็ดาวน์โหลดได้ | `wwwroot/Rotativa/` | ใช้วิธีสร้าง PDF แบบอื่น (ขั้นที่ 3) |
| S9 | script จาก CDN ไม่ล็อกเวอร์ชัน (flatpickr) และไม่มี SRI | `ManageWorkOrder.cshtml:148-149` | ติดตั้งผ่าน npm และ bundle เอง |

### 12.2 การทำงาน / ข้อมูล

| ID | ข้อสังเกต | หลักฐาน | คำถาม |
|---|---|---|---|
| F1 | เลขที่ใบงาน = อ่านเลขล่าสุดแล้ว +1 **นอก transaction และไม่ล็อก** → บันทึกพร้อมกันได้เลขซ้ำ (ฐานข้อมูลจริงไม่มี unique บน `WorkOrderNo` — ซ้ำได้จริง) · ลบใบล่าสุดแล้วเลขนั้นถูกใช้ซ้ำ | `HomeController.cs:91-116,397-427`, หัวข้อ 8.0 | Q18 |
| F2 | เปิดใบงานเดิม = ฟอร์มอ่านอย่างเดียว (`fieldset disabled`, ไม่มี hidden `Id`) แต่ปุ่มบันทึกยังกดได้ → POST เข้าทาง “สร้างใหม่” เสมอ · โค้ด UPDATE จึงไม่ถูกใช้ และแก้แค่บางช่องโดยไม่บันทึกผู้แก้/เวลาแก้ | `ManageWorkOrder.cshtml:5,12,141-142`, `HomeController.cs:91,185-202` | Q9 |
| F3 | ฟอร์มเลือกได้ทั้งวันและเวลารับ/ส่งงาน แต่คอลัมน์เป็น `date` → เวลาหาย · ใบพิมพ์ “เวลารับ” จึงเป็น 00:00 | `ManageWorkOrder.cshtml:99-100`, `PrintWorkOrder.cshtml:65`, schema | Q14 |
| F4 | `WorkOrder_List` ได้ 1 แถวต่อรถ 1 คัน → รายการใบงานแสดงซ้ำ, นับหน้าผิด, และพิมพ์ใบงานที่มีรถ > 1 คันน่าจะ error (`QuerySingleOrDefault`) | นิยาม view, `HomeController.cs:349,379-380` | Q15 |
| F5 | จำนวน/น้ำหนักเป็นช่องข้อความอิสระ แต่คอลัมน์เป็น `int` / `decimal` → กรอกไม่ใช่ตัวเลขแล้วบันทึกไม่ผ่าน**โดยไม่มีข้อความแจ้ง** · ไม่มีช่องกรอกหน่วย | `ManageWorkOrder.cshtml:73-89`, `HomeController.cs:176-182` | Q16 |
| F6 | ข้อความ “บันทึกสำเร็จ” ของใบงานถูกตั้งไว้แต่หน้าจอไม่แสดง | `HomeController.cs:206`, `ManageWorkOrder.cshtml` (ไม่อ่าน TempData) | — |
| F7 | แก้ไขพนักงานแล้วรหัสพนักงาน/ที่อยู่/เลขบัตรถูกล้างเป็นค่าว่าง · แก้ไขรถแล้วยี่ห้อถูกล้าง (ช่องไม่อยู่ในฟอร์มแต่ UPDATE เขียนทับ) | `EmployeeController.cs:56-61`, `VehicleController.cs:77-86` | Q20, Q22 |
| F8 | ราคาในตารางสถานที่รับ-ส่งไม่ถูกใช้ — ค่าขนส่งกรอกเอง · เลือกสถานที่รับแล้วระบบเติม “สถานที่ส่งคู่แรกที่เจอ” ให้ (และกลับกัน) | `HomeController.cs:289-310`, `ManageWorkOrder.cshtml:307-324` | Q12 |
| F9 | ไม่มีการคำนวณยอดรวมหรือภาษีใดๆ · `FeeOvernight` เก็บ “จำนวนคืน” ไม่ใช่จำนวนเงิน (ชื่อคอลัมน์ชวนเข้าใจผิด) | `Models/WorkOrder.cs:90-103`, `../Gemini_NPPOOL.txt:193-197` | Q13 |
| F10 | ไฟล์ที่ถูกอ้างแต่ไม่มีอยู่: `~/css/site.css` (ทุกหน้า) และ `~/images/logo_nppool.png` (โลโก้ใน PDF) | `_LayoutMain.cshtml:9,14`, `PrintWorkOrder.cshtml:46` | — |
| F11 | หน้า Location ใช้ layout ตั้งต้น (ไม่มีเมนู) และแสดงราคาไม่มีทศนิยม | `Views/Location/Index.cshtml:1-3,55` | — |
| F12 | ลบข้อมูลทุกอย่างแบบถาวร · ฐานข้อมูลไม่มี FK (ยืนยันแล้ว) → ลบลูกค้า/รถ/พนักงานที่ใบงานอ้างอยู่ได้ และชื่อหายจากรายการใบงาน | `*Controller.Delete`, หัวข้อ 8.0 | Q19 |
| F13 | ไม่มีหน้าจอเปลี่ยนสถานะงาน และไม่มีใบวางบิล (เมนูเป็นลิงก์ `#`) | `_LayoutMain.cshtml:46-53` | Q10, Q11 |
| F14 | ผู้ติดต่อต้นทางในใบพิมพ์ใช้ “ผู้สั่งงาน” (`ContactPerson`) แทน “ชื่อผู้ติดต่อ (รับ)” (`PickerUser`) | `PrintWorkOrder.cshtml:92,98` | Q17 |
| F15 | ส่วนที่ไม่ได้ใช้: EF Core Identity (`ApplicationDbContext` + migration), `Areas/Identity`, `_Layout`/`_LoginPartial`/Privacy, API ที่อยู่ DOPA, action `*_notuse`, ไฟล์ `.cshtml.cs` เปล่า 10 ไฟล์, ไฟล์สำรองนอกโปรเจกต์ | `Data/`, `Views/`, `../` | ไม่ต้องยกไประบบใหม่ |

## 13. สิ่งที่ยังขาด และวิธีเก็บเพิ่ม

| สิ่งที่ขาด | วิธีเก็บ | ใครทำ |
|---|---|---|
| จำนวนแถว, PK/FK/index/trigger/procedure, SQL Agent job, คุณภาพข้อมูล, ค่าสถานะ/ประเภทรถจริง, การเข้ารหัสไทย | ✅ รันสคริปต์อ่านอย่างเดียว [`sql/01-inventory-readonly.sql`](sql/01-inventory-readonly.sql) แล้ว 2026-11-26 → หัวข้อ 8.0 | เซสชันนี้ (ผู้ใช้อนุญาต) |
| ระบบที่ใช้งานจริงเป็นเวอร์ชันไหน อยู่ที่ไหน | ✅ ไม่ได้เปิดใช้งานแล้ว; ฐานข้อมูลอยู่บนเครื่องนี้ (Q1–Q2) | ผู้ใช้ |
| schema ฉบับเดียวกับ export (มี `Location_From_To`) | ไม่มีในเครื่องนี้ — ใช้ export + โค้ดเป็นต้นแบบ | — |
| หน้าตาจริงของหน้าจอและเอกสาร | ภาพหน้าจอ “สร้างใบงาน”, “รายการใบงาน” และ PDF ใบสั่งปฏิบัติงาน 1 ใบ — ปิดบังชื่อ/เบอร์/ที่อยู่ก่อน | ผู้ใช้ (ใช้ในขั้นที่ 2) |
| กฎธุรกิจที่ไม่อยู่ในโค้ด | ตอบคำถามค้างหัวข้อ 15 | ผู้ใช้ / เจ้าของระบบ |

## 14. ความลับที่พบ (บอกตำแหน่งเท่านั้น — ไม่คัดลอกค่า)

| ตำแหน่ง | ชนิด | หมายเหตุ |
|---|---|---|
| `appsettings.json` → `ConnectionStrings:DefaultConnection` | ชื่อเครื่อง/instance, ชื่อผู้ใช้ และรหัสผ่าน SQL Server | บัญชีผู้ดูแลระบบสูงสุด |
| `appsettings_dev.json`, `appsettings_server.json` → คีย์เดียวกัน | เหมือนข้างบน | รหัสผ่านเดียวกันทั้ง 3 ไฟล์ |
| `bin/Debug/net8.0/appsettings*.json`, `bin/Release/net8.0/appsettings*.json` | สำเนาจากการ build | |
| `C:\inetpub\wwwroot\NPPOOL\appsettings_dev.json`, `appsettings_server.json` | สำเนาที่ publish (รหัสผ่านเดียวกัน) | `appsettings.json` ที่ publish ใช้ Windows authentication |
| `Controllers/AccountController.cs:112`, `AccountController_cs.txt:109` | รหัสผ่านเขียนไว้ในคอมเมนต์ | ถ้ายังใช้กับบัญชีใดอยู่ควรเปลี่ยน |
| `Program.cs:50`, `Program_cs.txt:49` | โดเมน Cloudflare `*.workers.dev` ของระบบ | ไม่ใช่รหัสผ่าน แต่ระบุบัญชี — ไม่ใส่ใน repo |
| `../.vs/NPPOOL/CopilotIndices/*.db` | ดัชนีโค้ดของ Copilot อาจเก็บเนื้อหาไฟล์รวม config | ห้ามนำขึ้น git |
| `NPPool.csproj:7` | `UserSecretsId` (เป็นตัวระบุ ไม่ใช่ความลับ) | ไม่มีไฟล์ user-secrets ในเครื่อง (ตรวจแล้ว) |

ไม่พบไฟล์ `.env`, ใบรับรอง/กุญแจ (`.pfx`, `.pem`, `.key`), ไฟล์ backup ฐานข้อมูล หรือไฟล์ข้อมูล (CSV) ในโฟลเดอร์งานเดิม · `../Gemini_NPPOOL.txt` ไม่มีรหัสผ่าน

## 15. คำถามค้าง (Open Questions)

“ต้องการก่อน” = ต้องได้คำตอบก่อนขั้นนั้นจะเสร็จ — ขั้นที่ 2 เริ่มได้ก่อนโดยยังไม่ต้องตอบครบ

| ID | คำถาม | ผลกระทบ | ถามใคร | ต้องการก่อน | คำตอบ / วันที่ |
|---|---|---|---|---|---|
| **ระบบที่ใช้งานจริง** | | | | | |
| Q1 | ระบบที่ใช้งานจริงรันอยู่เครื่องไหน เปิดใช้ผ่านอินเทอร์เน็ต (Cloudflare) หรือไม่ และเป็น build ไหน? (สำเนา publish ในเครื่องนี้ = 2026-03-21 ยังไม่มีหน้าพิมพ์ PDF และหน้าสถานที่รับ-ส่ง) | ฟีเจอร์ที่ต้องทำให้เท่า, แผนย้ายข้อมูลและ cutover | ผู้ใช้ / ผู้ดูแลระบบ | ขั้นที่ 2 | ✅ ระบบไม่ได้เปิดใช้งานแล้ว — ใช้ซอร์สล่าสุดเป็นต้นแบบ และเพิ่มหน้าพิมพ์ PDF + หน้าสถานที่รับ-ส่งในระบบใหม่ · 2026-11-26 |
| Q2 | ฐานข้อมูลตัวจริงอยู่ instance ไหน และไฟล์ `TCRMIS_Database.xlsx` export จากตัวนั้นเมื่อไร? (`appsettings.json` ในซอร์สมี connection string ที่ขาดคีย์ `Server=`) | schema ที่ใช้ถอดแบบ | ผู้ใช้ / ผู้ดูแลระบบ | ขั้นที่ 2 | ✅ อยู่บนเครื่องนี้ `TCRMIS.NPPOOL` (default instance) — เป็น schema รุ่นก่อน export (หัวข้อ 8.0) · 2026-11-26 |
| Q3 | จะรันสคริปต์ `docs/rea/sql/01-inventory-readonly.sql` เอง หรืออนุญาตให้เซสชันนี้รันด้วย Windows authentication (อ่านอย่างเดียว ผลเป็นตัวเลขสรุป) ถ้าฐานข้อมูลอยู่ในเครื่องนี้? | จำนวนแถว, FK, คุณภาพข้อมูล | ผู้ใช้ | ขั้นที่ 2 | ✅ อนุญาตให้เซสชันรันด้วย Windows authentication — รันแล้ว (หัวข้อ 8.0) · 2026-11-26 |
| Q4 | มีผู้ใช้กี่คนต่อบทบาท ใช้งานพร้อมกันสูงสุดกี่คน และมีใบงานประมาณกี่ใบต่อเดือน? | ขนาดระบบ, แพ็กเกจ Neon/Vercel, การกันเลขที่ซ้ำ | ผู้ใช้ | ขั้นที่ 3 | 🟨 ฐานข้อมูลมีผู้ใช้ 1 คน (Admin) — ยังต้องการประมาณการใช้งานจริง |
| **ผู้ใช้และสิทธิ์** | | | | | |
| Q5 | บทบาทจริงมีอะไรบ้าง แต่ละบทบาททำอะไรได้? (โค้ด: Admin / Maker / Accounting · requirement แรก: Admin / User / GL) | role matrix | เจ้าของระบบ | ขั้นที่ 2 | ✅ ค่าเริ่มต้น: 3 บทบาทเดิม (admin / maker / accounting) ตาม role matrix ใน 02-domain-model หัวข้อ 6.2 · 2026-11-26 |
| Q6 | การสมัครสมาชิกเองจากหน้า Login (เลือกบทบาทเองได้) ตั้งใจให้มีหรือไม่? ระบบใหม่เสนอให้ Admin สร้างบัญชีเท่านั้น | ความปลอดภัย, ขอบเขต | เจ้าของระบบ | ขั้นที่ 2 | ✅ ไม่มีการสมัครเอง — Admin สร้างบัญชี · 2026-11-26 |
| Q7 | ย้ายบัญชีผู้ใช้พร้อมรหัสผ่านเดิม (ต้องรองรับ hash ของ ASP.NET Core Identity) หรือให้ทุกคนตั้งรหัสใหม่ตอนเปิดระบบ? | การเลือก Auth, การย้ายข้อมูล | เจ้าของระบบ | ขั้นที่ 3 | ✅ ไม่ย้ายรหัสผ่าน (AUTH-09 Drop) — Admin สร้างบัญชีใหม่ · 2026-11-26 |
| Q8 | ข้อมูลสถานที่รับ-ส่งและราคา ควรแก้ได้เฉพาะ Admin เหมือนข้อมูลพื้นฐานอื่นใช่ไหม? (ปัจจุบันไม่ตรวจสิทธิ์เลย) | role matrix | เจ้าของระบบ | ขั้นที่ 2 | ✅ Admin เท่านั้น (role matrix ที่ยืนยัน) · 2026-11-26 |
| **ใบงาน** | | | | | |
| Q9 | หลังบันทึกใบงานแล้ว แก้ไขได้หรือไม่ ใครแก้ได้ แก้ช่องไหนได้บ้าง? (หน้าจอปัจจุบันเปิดแบบอ่านอย่างเดียวตาม requirement “เอาปุ่มแก้ไขออก” แต่ controller มีโค้ดแก้ไขบางช่อง) | ฟีเจอร์แก้ไข, audit | เจ้าของระบบ | ขั้นที่ 2 | ✅ ผู้ใช้ตอบ 2026-11-27: “ปรับให้สามารถแก้ไขใบงานได้หลัง save ไปแล้ว” → Maker/Admin แก้ได้ทุกช่องของใบที่ยังไม่ยกเลิก (D26) · ผู้แก้/เวลาดูได้ในหน้าใบงานและ Activity Logs (ค่าเริ่มต้นเดิม 2026-11-26: ไม่มีการแก้ไข) |
| Q10 | สถานะงาน 8 สถานะเปลี่ยนอย่างไร ใครเป็นคนเปลี่ยน ต้องเรียงตามลำดับไหม? สถานะ 1 “เปิดใบสมัครงาน” คือ “เปิดใบสั่งงาน” หรือไม่? (ระบบเดิมเลือกสถานะได้แค่ตอนสร้างใบงาน) | workflow หลักของระบบ | เจ้าของระบบ | ขั้นที่ 2 | 🟨 ค่าเริ่มต้น: MVP เลือกสถานะตอนสร้างเท่านั้น · ฐานข้อมูลใช้ชื่อสถานะ 1 “เปิดใบงาน” แล้ว · ลำดับและผู้เปลี่ยนสถานะต้องได้คำตอบก่อนทำ WO-15 (สมมติฐานใน 02-domain-model หัวข้อ 5) |
| Q11 | ใบวางบิล (สร้าง/ตรวจ) อยู่ในขอบเขตระบบใหม่ไหม? ถ้าใช่ ขอแบบฟอร์ม, กฎ VAT / หัก ณ ที่จ่าย, รอบวางบิล และรูปแบบเลขที่เอกสาร | ขอบเขต MVP | เจ้าของระบบ | ขั้นที่ 2 | ✅ ค่าเริ่มต้น: อยู่นอก MVP — ต้องได้ spec ก่อนทำ BILL-01/02 · 2026-11-26 |
| Q12 | ค่าขนส่งควรดึงจากราคาในข้อมูลสถานที่รับ-ส่งอัตโนมัติไหม? คู่สถานที่เดียวกันมีหลายราคา หรือราคาต่างกันตามลูกค้า/ประเภทรถไหม? | กฎคำนวณราคา | เจ้าของระบบ | ขั้นที่ 2 | |
| Q13 | ยอดรวมใบงานคิดอย่างไร เช่น ค่าขนส่ง + ค่าผ่านท่า + ค่าเสียเวลา + จำนวนคืน × ค่าแรงค้างคืน + จำนวนคน × ค่าแรงคน? มี VAT ไหม? | กฎคำนวณ, ใบวางบิล | เจ้าของระบบ | ขั้นที่ 2 | |
| Q14 | วันที่รับ/ส่งงานต้องมีเวลาด้วยไหม? (ฟอร์มเลือกเวลาได้ แต่ฐานข้อมูลเก็บแค่วันที่) | data model, ใบพิมพ์ | เจ้าของระบบ | ขั้นที่ 2 | ✅ ค่าเริ่มต้น: เก็บวัน+เวลา · 2026-11-26 |
| Q15 | ใบงานที่มีรถหลายคัน: รายการใบงานควรแสดง 1 แถวต่อใบงานหรือต่อรถ และพิมพ์ใบสั่งปฏิบัติงาน 1 ใบต่อใบงานหรือต่อรถ 1 คัน? | หน้ารายการ, PDF | เจ้าของระบบ | ขั้นที่ 2 | ✅ ค่าเริ่มต้น: รายการ 1 แถวต่อใบงาน · พิมพ์ 1 ใบต่อใบงาน แสดงรถทุกคัน · 2026-11-26 |
| Q16 | จำนวน/น้ำหนักต้องเป็นตัวเลขพร้อมหน่วยไหม หน่วยที่ใช้มีอะไรบ้าง (เช่น พาเลท กล่อง kg ตัน)? | validation, data model | เจ้าของระบบ | ขั้นที่ 2 | 🟨 แบบใช้ค่าเริ่มต้น: ตัวเลข + หน่วยเป็นข้อความ (Design 02 หัวข้อ 3.3) — ยืนยันรายการหน่วยภายหลัง |
| Q17 | ช่องในใบพิมพ์ที่ยังเป็น “-” (เลข Job ของลูกค้า, Ref.No, CS Name, ผู้ติดต่อปลายทาง) ต้องแสดงข้อมูลอะไร? ขอ PDF หรือภาพใบงานจริง 1 ใบที่ปิดบังข้อมูลแล้ว | report spec | เจ้าของระบบ | ขั้นที่ 2 | ✅ ค่าเริ่มต้น: Job ลูกค้า = Job No./Shipment · ผู้ติดต่อ = ของแต่ละฝั่ง · Ref.No / CS Name เว้นว่าง · 2026-11-26 |
| Q18 | เลขที่ใบงาน: ตัดเดือนตามเวลาไทยใช่ไหม, เดือนหนึ่งเกิน 9,999 ใบได้ไหม, นำเลขที่ถูกลบกลับมาใช้ได้ไหม, ระบบใหม่ต้องนับต่อจากระบบเดิมไหม? | business rule เลขที่เอกสาร | เจ้าของระบบ | ขั้นที่ 2 | 🟨 แบบใช้ค่าเริ่มต้น (ADR-0007): ตัดเดือนตามเวลาไทย, เกิน 9,999 ยาวเป็น 5 หลัก, ไม่นำเลขกลับมาใช้, เริ่มนับ 1 |
| Q19 | การลบ (ใบงาน/ลูกค้า/รถ/พนักงาน) ต้องลบถาวร หรือใช้ “ยกเลิก”/เก็บประวัติแทน? ลบลูกค้าที่มีใบงานแล้วได้ไหม? | data model, audit | เจ้าของระบบ | ขั้นที่ 2 | ✅ ค่าเริ่มต้น: ยกเลิกใบงาน (สถานะ 2) แทนการลบ · ข้อมูลพื้นฐานปิดใช้งานแทนการลบ (ADR-0010) · 2026-11-26 |
| **ข้อมูลพื้นฐาน** | | | | | |
| Q20 | ต้องเก็บรหัสพนักงาน / เลขบัตรประชาชน / ที่อยู่ของพนักงานขับรถไหม? (ฟอร์มเอาออกแล้ว แต่การแก้ไขล้างค่าเดิม · เลขบัตรประชาชนเป็นข้อมูลอ่อนไหวตาม PDPA) | data model, PDPA | เจ้าของระบบ | ขั้นที่ 2 | ✅ ไม่เก็บ (MD-07 Drop) · 2026-11-26 |
| Q21 | นอกจากคนขับมีพนักงานประเภทอื่นไหม คนขับผูกกับรถประจำไหม มีรถร่วม/รถนอกไหม? | data model | เจ้าของระบบ | ขั้นที่ 2 | |
| Q22 | ยังต้องใช้ยี่ห้อรถไหม และใครดูแลรายการประเภทรถ/ยี่ห้อรถ? (ไม่มีหน้าจอจัดการ · ค่าในฐานข้อมูลเป็นประเภท/ยี่ห้อรถยนต์นั่ง ไม่ใช่รถบรรทุก — ขอรายการประเภทรถที่ใช้จริง เช่น 4 ล้อ / 6 ล้อ / 10 ล้อ) | ขอบเขตหน้าจอ, ข้อมูลตั้งต้น | เจ้าของระบบ | ขั้นที่ 2 | 🟨 ยี่ห้อรถไม่ใช้ (MD-06 Drop) · ยังต้องการรายการประเภทรถจริงก่อน seed |
| Q23 | ตาราง `Lookup_PickDropLocation` ยังใช้อยู่ไหม? (โค้ดปัจจุบันใช้ `Location_From_To` แทน) | การย้ายข้อมูล | ผู้ใช้ | ขั้นที่ 3 | 🟨 มี 1 แถว ไม่มีโค้ดใช้ → เสนอเลิกใช้ (รอยืนยัน) |
| Q24 | ต้องการที่อยู่แบบจังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์กลับมาไหม? (เอาออกจากฟอร์มแล้ว แต่คอลัมน์และข้อมูล DOPA ยังอยู่) | data model | เจ้าของระบบ | ขั้นที่ 3 | ✅ ไม่ต้องการ (WO-19 Drop) · 2026-11-26 |
| **ข้อมูลเดิมและการแสดงผล** | | | | | |
| Q25 | ข้อมูลในระบบเดิมเป็นข้อมูลจริงตั้งแต่เมื่อไร มีข้อมูลทดสอบปนไหม ต้องย้ายทั้งหมดหรือเริ่มใหม่? | ขั้นที่ 6 | ผู้ใช้ | ขั้นที่ 6 | ✅ ไม่ย้ายข้อมูลธุรกรรม (GEN-06 Drop / D8) — seed ข้อมูลอ้างอิงเท่านั้น · 2026-11-26 |
| Q26 | เครื่อง server ตั้งรูปแบบภาษา/วันที่เป็นไทยหรือไม่ — หน้ารายการใบงานแสดงปีเป็น พ.ศ. หรือ ค.ศ.? | การแปลงวันที่, การแสดงผล | ผู้ใช้ | ขั้นที่ 2 | ✅ ค่าเริ่มต้น: แสดงปี พ.ศ. (ADR-0008) · 2026-11-26 |
| Q27 | ระบบใหม่ใช้หน้าตาและแบรนด์ NP Pool เอง (มีโลโก้แล้ว) แทนการเลียนแบบเว็บไซต์ของบริษัทอื่นตาม requirement เดิมได้ไหม? | UI | เจ้าของระบบ | ขั้นที่ 3 | 🟨 เสนอใช้แบรนด์ NP Pool เอง (ADR-0006) — รออนุมัติแบบ |
| Q28 | ต้องใช้บนมือถือไหม (เช่น คนขับดูงานหรืออัปเดตสถานะ) หรือใช้ในสำนักงานเป็นหลัก? | UI, ขอบเขต | เจ้าของระบบ | ขั้นที่ 3 | 🟨 Could (GEN-04) — ทำหลัง MVP |

## 16. ขั้นที่ 2 (Analysis)

ทำแล้ว 2026-11-26 → [02-domain-model.md](02-domain-model.md) (คำศัพท์, domain model, ER, data dictionary, วงจรสถานะ, role matrix, user flow) · [04-business-rules.md](04-business-rules.md) (กฎธุรกิจ 33 ข้อพร้อมหลักฐานและตัวอย่าง) · [03-feature-parity.md](03-feature-parity.md) (46 ฟีเจอร์, ความต่างที่ตั้งใจ, ขอบเขต MVP, สิ่งที่ขอให้ยืนยัน)
