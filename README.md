# my-chrome-extension

รวม Chrome extensions หลายตัวไว้ในที่เดียว แต่ละโฟลเดอร์เป็น extension แยกอิสระ ติดตั้งทีละตัวตามต้องการ

## Extensions

| Extension | คำอธิบาย |
|---|---|
| [`aes-gcm-extension`](aes-gcm-extension/README.md) | เข้ารหัส/ถอดรหัสข้อมูลด้วย AES-GCM (Hex / Base64) |
| [`password-generator-extension`](password-generator-extension/README.md) | สร้างรหัสผ่านที่ปลอดภัย กำหนดความยาว/ชนิดตัวอักษรได้ |
| [`centrifugo-chrome-extension`](centrifugo-chrome-extension/README.md) | เชื่อมต่อ Centrifugo server ผ่าน WebSocket เพื่อ debug real-time traffic |

## วิธีติดตั้ง (Load Unpacked) — ทำเหมือนกันทุกตัว

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ของ extension ที่ต้องการ (เช่น `aes-gcm-extension`) — **ต้องเลือกทีละโฟลเดอร์ ห้ามเลือกโฟลเดอร์ root** เพราะแต่ละ extension มี `manifest.json` ของตัวเอง
5. ทำซ้ำขั้นตอนที่ 3-4 หากต้องการติดตั้งหลาย extension พร้อมกัน

ดูรายละเอียดการใช้งานของแต่ละตัวได้ที่ README ในโฟลเดอร์ของ extension นั้น ๆ
