# Secret Masker

Chrome extension สำหรับ mask ค่าที่ sensitive ใน JSON/YAML อัตโนมัติ ก่อน copy/screenshot ไปแชร์ที่อื่น

## วิธีติดตั้ง (Load Unpacked)

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `secret-masker-extension` (โฟลเดอร์นี้)
5. ไอคอนของ Secret Masker จะปรากฏในแถบเครื่องมือ (toolbar) — หากไม่เห็น ให้กดไอคอนรูปจิ๊กซอว์ (Extensions) แล้ว pin ไว้

## วิธีใช้งาน

1. คลิกไอคอน extension เพื่อเปิด popup
2. วาง JSON หรือ YAML ลงในช่อง Input — extension จะ auto-detect format ให้เอง (แสดง badge JSON/YAML)
3. ผลลัพธ์ที่ mask ค่า sensitive แล้วจะแสดงในช่อง Masked output ทันที (format เดิม ไม่แปลง JSON↔YAML)
4. กดปุ่ม **Copy** เพื่อคัดลอกผลลัพธ์

## Key ที่ถูก mask อัตโนมัติ

ระบบจะ mask ค่า (แทนที่ด้วย `********`) เมื่อชื่อ key มีคำเหล่านี้อยู่ (ไม่สนตัวพิมพ์เล็ก-ใหญ่):

`password, passwd, pwd, secret, token, apikey, api_key, key, cred, auth, private, access, session, cookie, bearer, jwt, ssn, card, cvv, pin, salt, hash`

ระบบจะไล่ลงไปใน object/array ที่ซ้อนกันด้วย เพื่อจับค่าที่ซ่อนอยู่ลึกๆ

## อัปเดตโค้ด

หลังแก้ไขไฟล์ในโฟลเดอร์นี้ ให้กลับไปที่ `chrome://extensions` แล้วกดปุ่ม **รีโหลด (⟳)** ที่การ์ดของ extension เพื่อให้ Chrome โหลดโค้ดใหม่
