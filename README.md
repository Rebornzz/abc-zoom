# ABC Zoom Booking

ระบบจอง Zoom ของสำนักวิชาการบัญชีและการเงิน

- Gantt timeline ม่วง/ชมพู รองรับมือถือ
- ไทย / English และธีมสว่าง / มืด
- จองโดยไม่ล็อกอิน เวลาไทย 00:01–23:59
- จองซ้ำรายวัน รายสัปดาห์ รายเดือน
- ยกเลิกด้วยรหัสประจำชุด พร้อมบันทึกชื่อ เหตุผล และประวัติ
- Admin จัดการบัญชี Zoom และดูประวัติ

Frontend นี้ใช้ Supabase Project แยก ระบบหลังบ้านติดตั้งผ่าน Edge Function ชื่อ zoom-portal แล้ว รหัสผ่าน Zoom และข้อมูลการจองอยู่ฝั่งฐานข้อมูล ไม่อยู่ใน repository

GitHub Pages: Settings → Pages → Deploy from a branch → main → / (root)

เปิด index.html ผ่านเว็บเซิร์ฟเวอร์ หรือใช้ GitHub Pages เพื่อใช้งาน
