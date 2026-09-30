# YAML (Rancher config/env)

เลือกปลายทาง **YAML (Rancher config/env)** เพื่อแปลงค่า config/environment
เป็น YAML ที่เก็บ int และ boolean เป็น string พร้อม single quote โดยไม่บังคับ quote ข้อความทั่วไป
ใช้ได้กับ Convert, Swap, Pretty และ Minify

ตัวอย่าง ENV:

```dotenv
PORT=8080
DEBUG=true
CODE=00123
HOST=localhost
```

ผลลัพธ์:

```yaml
PORT: '8080'
DEBUG: 'true'
CODE: '00123'
HOST: localhost
```

โหมดนี้ใช้สำหรับ config/environment values ไม่ใช่ Kubernetes manifest ทั้งไฟล์
เพราะช่องอย่าง `replicas` และ `containerPort` ต้องเป็นตัวเลข ให้เลือก **YAML** ปกติสำหรับ manifest
ค่า null ยังคงเป็น null ส่วนข้อความจะ quote เฉพาะเมื่อจำเป็นตาม YAML เช่นค่าว่างหรือข้อความที่มี `: `
ข้อความหลายบรรทัดจะให้ YAML library เลือกรูปแบบที่รักษาค่าเดิม

หลังอัปเดตให้ Reload Dev Toolbox ที่ `chrome://extensions` แล้วปิดและเปิดแท็บ Dev Toolbox ใหม่

รัน regression tests ด้วย `node --test dev-toolbox-extension/tools/format-converter/converter.test.cjs` จากโฟลเดอร์โปรเจกต์
