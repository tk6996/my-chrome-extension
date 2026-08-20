# Dev Toolbox

Chrome extension ที่รวมเครื่องมือทั้งหมดในโปรเจกต์นี้ไว้ใน extension เดียว คลิกไอคอนแล้วเปิดเป็น Tab เต็มจอ (ไม่ใช่ popup เล็กๆ) มีเมนูด้านซ้ายให้สลับเครื่องมือ

## เครื่องมือที่รวมไว้ (เรียงตามเมนู A-Z)

- AES-GCM Crypto Tool — เข้ารหัส/ถอดรหัสด้วย AES-GCM
- Centrifugo Debug Client — เชื่อมต่อ Centrifugo server ผ่าน WebSocket
- Format Converter — แปลงข้อมูลระหว่าง JSON, CSV, XML, YAML, ENV
- JWT Debugger — decode/แก้ไข/verify JSON Web Token
- Password Generator — สร้างรหัสผ่านที่ปลอดภัย
- QR/Barcode Image Decoder — ถอดรหัส QR/barcode จากรูปใน clipboard
- Secret Masker — mask ค่า sensitive ใน JSON/YAML
- UUID Generator — สร้าง UUID v4 แบบสุ่ม

แต่ละเครื่องมือทำงานเหมือนเดิมทุกประการ (โค้ดหน้าตาเดิม เพียงย้ายมาอยู่ใต้ `tools/` และแสดงผลผ่าน iframe) — extension แยกทั้ง 7 ตัวเดิมยังคงอยู่และติดตั้งแยกได้เหมือนเดิมด้วย ทุกเครื่องมือใช้ theme สี/ฟอนต์ชุดเดียวกัน

**State ไม่หายเวลาสลับเมนู** — ทุก iframe ของเครื่องมือถูก mount ค้างไว้ทั้งหมด (โหลด src ครั้งแรกที่เปิดแล้วเก็บไว้ในหน่วยความจำ) สลับเมนูไปมาแค่สลับการแสดงผล ไม่ reload iframe ใหม่ ดังนั้น connection ที่เปิดค้าง (เช่น Centrifugo WebSocket), log, และค่าที่กรอกในฟอร์มจะยังอยู่เหมือนเดิมตอนสลับกลับมา

**Light/Dark toggle เดียว ใช้ทั้ง Toolbox** — ปุ่ม 🌙/☀️ มุมขวาบนของ content bar (ใน hub) สลับธีมของ hub และทุกเครื่องมือพร้อมกันทันที แม้เครื่องมือนั้นจะเปิดค้างอยู่เบื้องหลังก็ตาม (sync กันผ่าน `localStorage` + `storage` event เพราะทุก iframe อยู่ origin เดียวกัน) ปุ่มเดิมในหน้า Centrifugo เองก็ยังใช้ได้และ sync กลับมาที่ hub เหมือนกัน

## วิธีติดตั้ง (Load Unpacked)

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `dev-toolbox-extension` (โฟลเดอร์นี้)
5. คลิกไอคอน Dev Toolbox ในแถบเครื่องมือ — extension จะเปิด Tab ใหม่ (หรือโฟกัสไปที่ Tab เดิมถ้าเปิดอยู่แล้ว) พร้อมเมนูเครื่องมือด้านซ้าย

## อัปเดตโค้ด

หลังแก้ไขไฟล์ในโฟลเดอร์นี้ ให้กลับไปที่ `chrome://extensions` แล้วกดปุ่ม **รีโหลด (⟳)** ที่การ์ดของ extension แล้วปิด/เปิด Tab ของ Dev Toolbox ใหม่
