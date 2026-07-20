# Format Converter

Chrome extension สำหรับแปลงข้อมูลไปมาระหว่าง JSON, CSV, XML, YAML และ ENV

## วิธีติดตั้ง (Load Unpacked)

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `format-converter-extension` (โฟลเดอร์นี้)
5. ไอคอนของ Format Converter จะปรากฏในแถบเครื่องมือ (toolbar) — หากไม่เห็น ให้กดไอคอนรูปจิ๊กซอว์ (Extensions) แล้ว pin ไว้

## วิธีใช้งาน

1. คลิกไอคอน extension เพื่อเปิด popup
2. เลือก format ต้นทาง (from) และ format ปลายทาง (to) จาก dropdown — กดปุ่ม ⇄ เพื่อสลับสองฝั่งได้
3. วางข้อมูลลงในช่อง Input แล้วกด **Convert** ผลลัพธ์จะแสดงในช่อง Output
4. ใช้ปุ่ม **Pretty**/**Minify** เพื่อจัดรูปแบบข้อมูลในช่อง Input/Output ตาม format ปัจจุบันของช่องนั้น
5. กดปุ่ม **Copy** เพื่อคัดลอกผลลัพธ์

หมายเหตุ: เมื่อแปลงเป็น ENV จะ flatten โครงสร้างซ้อนด้วย `_` และแปลง key เป็นตัวพิมพ์ใหญ่อัตโนมัติ (เช่น `address.city` → `ADDRESS_CITY`)

## อัปเดตโค้ด

หลังแก้ไขไฟล์ในโฟลเดอร์นี้ ให้กลับไปที่ `chrome://extensions` แล้วกดปุ่ม **รีโหลด (⟳)** ที่การ์ดของ extension เพื่อให้ Chrome โหลดโค้ดใหม่
