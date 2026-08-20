# JWT Debugger

Chrome extension สำหรับ decode / แก้ไข / verify JSON Web Token (JWT) ทำงานทั้งหมดในเบราว์เซอร์ (client-side) ไม่มีการส่งข้อมูลออกไปที่ไหน คล้าย [token.dev](https://www.token.dev/) แต่ใช้ style เดียวกับ extension อื่นๆ ในโปรเจกต์นี้

## วิธีติดตั้ง (Load Unpacked)

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `jwt-debugger-extension` (โฟลเดอร์นี้)

## วิธีใช้งาน

1. วาง JWT ลงในช่อง **JWT** — ระบบจะ decode Header/Payload เป็น JSON ให้อัตโนมัติ พร้อมแสดง badge ของ `alg` และสถานะ `exp` (หมดอายุหรือยัง)
2. แก้ไข Header/Payload ได้โดยตรง — ช่อง **Encoded JWT** ด้านล่างจะอัปเดตให้ทันที
3. ตรวจสอบ/สร้างลายเซ็น:
   - **HS256/384/512** — ใส่ secret แล้วกด **Verify** เพื่อตรวจสอบ หรือ **Sign with this secret** เพื่อเซ็นใหม่ (ถ้าใส่ secret ไว้แล้ว แก้ไข Header/Payload จะเซ็นใหม่ให้อัตโนมัติ)
   - **RS/ES/PS 256/384/512** — ใส่ public key (PEM) แล้วกด **Verify** (รองรับเฉพาะตรวจสอบ ไม่รองรับเซ็นด้วย private key)
4. กดปุ่ม **Copy** เพื่อคัดลอก JWT ที่ได้

⚠️ อย่านำ secret/private key ที่ใช้งานจริงใน production มาใส่ในเครื่องมือนี้หรือเครื่องมือ debug อื่นๆ

## อัปเดตโค้ด

หลังแก้ไขไฟล์ในโฟลเดอร์นี้ ให้กลับไปที่ `chrome://extensions` แล้วกดปุ่ม **รีโหลด (⟳)** ที่การ์ดของ extension เพื่อให้ Chrome โหลดโค้ดใหม่
