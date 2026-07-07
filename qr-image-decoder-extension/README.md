# QR/Barcode Image Decoder

Chrome extension สำหรับถอดรหัส QR code / barcode จากรูปภาพที่ copy ไว้ใน clipboard โดยใช้ไลบรารี [jsQR](https://github.com/cozmo/jsQR) (vendored ไว้ในโฟลเดอร์นี้ ทำงาน offline ทั้งหมด ไม่มีการส่งข้อมูลออกนอกเครื่อง)

## วิธีติดตั้ง (Load Unpacked)

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `qr-image-decoder-extension` (โฟลเดอร์นี้)
5. ไอคอนของ QR/Barcode Image Decoder จะปรากฏในแถบเครื่องมือ (toolbar) — หากไม่เห็น ให้กดไอคอนรูปจิ๊กซอว์ (Extensions) แล้ว pin ไว้

## วิธีใช้งาน

1. Copy รูปภาพที่มี QR code หรือ barcode (เช่น copy รูปจากเว็บ, จาก Explorer, หรือ screenshot)
2. คลิกไอคอน extension เพื่อเปิด popup
3. คลิกที่กล่องเส้นประแล้วกด `Ctrl+V` เพื่อวางรูป หรือกดปุ่ม **Paste from Clipboard**
4. ข้อความที่ถอดรหัสได้จะแสดงในช่อง Decoded Text — กดปุ่มคัดลอก (⎘) เพื่อคัดลอกผลลัพธ์ได้

หากไม่พบ QR/barcode ในรูป หรือ clipboard ไม่มีรูปภาพ จะแสดงข้อความ error ให้ทราบ

## อัปเดตโค้ด

หลังแก้ไขไฟล์ในโฟลเดอร์นี้ ให้กลับไปที่ `chrome://extensions` แล้วกดปุ่ม **รีโหลด (⟳)** ที่การ์ดของ extension เพื่อให้ Chrome โหลดโค้ดใหม่
