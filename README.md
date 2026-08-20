# my-chrome-extension

รวม Chrome extensions หลายตัวไว้ในที่เดียว แต่ละโฟลเดอร์เป็น extension แยกอิสระ ติดตั้งทีละตัวตามต้องการ

## Extensions

| Extension | คำอธิบาย |
|---|---|
| [`dev-toolbox-extension`](dev-toolbox-extension/README.md) | รวมเครื่องมือทั้งหมดด้านล่างไว้ใน extension เดียว เปิดเป็น Tab เดียวพร้อมเมนูสลับเครื่องมือ |
| [`aes-gcm-extension`](aes-gcm-extension/README.md) | เข้ารหัส/ถอดรหัสข้อมูลด้วย AES-GCM (Hex / Base64) |
| [`password-generator-extension`](password-generator-extension/README.md) | สร้างรหัสผ่านที่ปลอดภัย กำหนดความยาว/ชนิดตัวอักษรได้ |
| [`centrifugo-chrome-extension`](centrifugo-chrome-extension/README.md) | เชื่อมต่อ Centrifugo server ผ่าน WebSocket เพื่อ debug real-time traffic |
| [`qr-image-decoder-extension`](qr-image-decoder-extension/README.md) | ถอดรหัส QR code / barcode จากรูปภาพที่ copy ไว้ใน clipboard |
| [`format-converter-extension`](format-converter-extension/README.md) | แปลงข้อมูลไปมาระหว่าง JSON, CSV, XML, YAML, ENV |
| [`secret-masker-extension`](secret-masker-extension/README.md) | Mask ค่า sensitive (password, token, secret ฯลฯ) ใน JSON/YAML อัตโนมัติ |
| [`jwt-debugger-extension`](jwt-debugger-extension/README.md) | Decode/แก้ไข/verify JWT (HS/RS/ES/PS) ทั้งหมดในเบราว์เซอร์ |

## วิธีติดตั้ง (Load Unpacked) — ทำเหมือนกันทุกตัว

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ของ extension ที่ต้องการ (เช่น `aes-gcm-extension`) — **ต้องเลือกทีละโฟลเดอร์ ห้ามเลือกโฟลเดอร์ root** เพราะแต่ละ extension มี `manifest.json` ของตัวเอง
5. ทำซ้ำขั้นตอนที่ 3-4 หากต้องการติดตั้งหลาย extension พร้อมกัน

หมายเหตุ: `dev-toolbox-extension` ต่างจากตัวอื่นตรงที่คลิกไอคอนแล้วจะเปิดเป็น Tab ใหม่ (ไม่ใช่ popup) พร้อมเมนูสลับไปใช้เครื่องมือแต่ละตัวได้ในที่เดียว

ดูรายละเอียดการใช้งานของแต่ละตัวได้ที่ README ในโฟลเดอร์ของ extension นั้น ๆ
