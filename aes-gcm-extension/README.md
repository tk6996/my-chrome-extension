# AES-GCM Crypto Tool

Chrome extension สำหรับเข้ารหัส/ถอดรหัสข้อมูลด้วย AES-GCM รองรับรูปแบบ Hex (Base16) และ Base64

## วิธีติดตั้ง (Load Unpacked)

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `aes-gcm-extension` (โฟลเดอร์นี้)
5. ไอคอนของ AES-GCM Crypto Tool จะปรากฏในแถบเครื่องมือ (toolbar) — หากไม่เห็น ให้กดไอคอนรูปจิ๊กซอว์ (Extensions) แล้ว pin ไว้

## วิธีใช้งาน

1. คลิกไอคอน extension เพื่อเปิด popup
2. กรอก Key (และ IV สำหรับ Decrypt) พร้อมเลือกรูปแบบข้อมูล (Hex / Base64 / UTF-8)
3. เลือกแท็บ **Encrypt** หรือ **Decrypt** แล้วกรอกข้อความ
4. กดปุ่ม Encrypt/Decrypt เพื่อดูผลลัพธ์ สามารถกดปุ่มคัดลอก (⎘) เพื่อคัดลอกผลลัพธ์ได้

## อัปเดตโค้ด

หลังแก้ไขไฟล์ในโฟลเดอร์นี้ ให้กลับไปที่ `chrome://extensions` แล้วกดปุ่ม **รีโหลด (⟳)** ที่การ์ดของ extension เพื่อให้ Chrome โหลดโค้ดใหม่
