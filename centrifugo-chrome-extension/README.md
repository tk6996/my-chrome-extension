# Centrifugo Debug Client

Chrome extension สำหรับเชื่อมต่อ Centrifugo server ผ่าน WebSocket, subscribe channel, publish ข้อความ และตรวจสอบ traffic แบบ real-time

## วิธีติดตั้ง (Load Unpacked)

1. เปิด Chrome แล้วไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `centrifugo-chrome-extension` (โฟลเดอร์นี้)
5. ไอคอนของ Centrifugo Debug Client จะปรากฏในแถบเครื่องมือ (toolbar) — หากไม่เห็น ให้กดไอคอนรูปจิ๊กซอว์ (Extensions) แล้ว pin ไว้

## วิธีใช้งาน

1. คลิกไอคอน extension — ต่างจาก extension อื่น extension นี้ **ไม่มี popup** แต่จะเปิดหน้าแอป (`app.html`) เป็นแท็บใหม่แทน
2. หากมีแท็บแอปเปิดอยู่แล้ว การคลิกไอคอนซ้ำจะสลับไปยังแท็บเดิมแทนการเปิดแท็บใหม่
3. ในหน้าแอป ให้กรอก URL ของ Centrifugo server, subscribe channel ที่ต้องการ แล้วเริ่ม publish/inspect ข้อความได้เลย
4. ต้องการสิทธิ์ `storage` (จำค่าที่ตั้งไว้) และ `tabs` (จัดการแท็บของแอป)

## อัปเดตโค้ด

หลังแก้ไขไฟล์ในโฟลเดอร์นี้ ให้กลับไปที่ `chrome://extensions` แล้วกดปุ่ม **รีโหลด (⟳)** ที่การ์ดของ extension เพื่อให้ Chrome โหลดโค้ดใหม่ (หากมีแท็บแอปเปิดอยู่ ให้รีเฟรชแท็บนั้นด้วย)
