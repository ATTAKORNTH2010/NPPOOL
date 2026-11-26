# ADR-0006: UI = Tailwind CSS + shadcn/ui + ฟอนต์ไทย

- สถานะ: เสนอ
- วันที่: 2026-11-26

## บริบท

ระบบเดิมใช้ Bootstrap 5 + jQuery + Select2 + flatpickr (บางตัวโหลดจาก CDN ไม่ล็อกเวอร์ชัน — S9) · หน้าจอต้องการ: ฟอร์มยาวหลายส่วน, รายการค้นหาได้ (combobox), ปฏิทิน + เวลา, กล่องยืนยัน, ตาราง, ข้อความ error ภาษาไทย · requirement เดิมขอให้หน้าตาเหมือนเว็บไซต์ของบริษัทอื่น — ระบบใหม่ไม่เลียนแบบแบรนด์ของผู้อื่น ใช้แบรนด์ NP Pool เอง (Q27)

## ทางเลือก

1. **Tailwind CSS v4 + shadcn/ui** — component เป็นโค้ดในโปรเจกต์ (บน Radix), ปรับแต่งได้เต็มที่, มี Combobox / Calendar / Dialog / Table / Sidebar / Form ครบ
2. MUI หรือ Ant Design — ครบแต่หนัก ปรับให้เป็นแบรนด์เองยากกว่า
3. Bootstrap — คุ้นเคย แต่ไม่ได้ออกแบบมาสำหรับ React

## การตัดสินใจ (เสนอ)

- Tailwind CSS 4.x + shadcn/ui (CLI `shadcn` 4.x) + ไอคอน lucide
- ฟอร์ม: react-hook-form 7.x + `@hookform/resolvers` + Zod (schema เดียวกับ server) · toast: sonner · ปฏิทิน: react-day-picker 10 (Calendar ของ shadcn/ui)
- ฟอนต์ผ่าน `next/font/google` (โฮสต์พร้อมแอป ไม่โหลดจาก CDN ตอนใช้งาน): หน้าจอใช้ **Noto Sans Thai** · หน้าพิมพ์ใช้ **Sarabun**
- สี: สีหลักน้ำเงินจากพื้นโลโก้ NP Pool · สีเน้นเหลือง `#FFC000` แบบหัวกล่องในใบพิมพ์เดิม · ใช้โลโก้เดิม (ผู้ใช้เป็นเจ้าของ)

## ผลที่ตามมา

- component อยู่ในโปรเจกต์ → เราดูแลเอง แต่ปรับได้อิสระ
- ตรวจความเข้ากันได้ของ shadcn/ui กับ Next.js 16 + Tailwind 4 ตอน scaffold
- ปรับขนาดตัวอักษร / ระยะบรรทัดสำหรับภาษาไทยให้อ่านง่าย (สระบน-ล่างไม่ชนกัน)
