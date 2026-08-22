# 🚨 การแก้ปัญหา: โหลดข้อมูลกลุ่มไม่ได้ / API 500

## สาเหตุ

โดยปกติเกิดเพราะตั้ง `MONGODB_URI` ไว้แล้วแต่ **ต่อ MongoDB ไม่ได้** ทำให้ `GET /api/group` ตอบ 500
(ถ้าไม่ได้ตั้ง `MONGODB_URI` เลย แอปจะเข้า mock mode ให้อัตโนมัติ ไม่ error)

## วิธีแก้ไข

### Option 1: ใช้ MongoDB Local (แนะนำสำหรับ dev)

1. **ติดตั้ง MongoDB**:
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   
   # หรือใช้ Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **เช็คว่า MongoDB running**:
   ```bash
   mongosh
   # หรือ
   brew services list | grep mongodb
   ```

3. **ไฟล์ `.env.local` ใช้ค่าเดิม**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/trip-payment
   ```

4. **รีสตาร์ท dev server**:
   ```bash
   # กด Ctrl+C ใน terminal ที่รัน dev server
   bun run dev
   ```

### Option 2: ใช้ MongoDB Atlas (Free Cloud Database)

1. **สร้าง MongoDB Atlas Account**:
   - ไปที่ https://www.mongodb.com/cloud/atlas/register
   - สมัครฟรี

2. **สร้าง Cluster**:
   - เลือก Free tier (M0)
   - เลือก region ใกล้ที่สุด (Singapore)
   - คลิก Create

3. **ตั้งค่า Access**:
   - **Database Access**: สร้าง user + password
   - **Network Access**: เพิ่ม IP `0.0.0.0/0` (allow all)

4. **Get Connection String**:
   - คลิก "Connect" -> "Drivers"
   - คัดลอก connection string
   - แทนที่ `<password>` ด้วยรหัสผ่านที่สร้าง

5. **แก้ไข `.env.local`**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trip-payment?retryWrites=true&w=majority
   ```

6. **รีสตาร์ท dev server**:
   ```bash
   bun run dev
   ```

### Option 3: ทดสอบโดยไม่ใช้ Database (Quick Test)

ไม่ต้องทำอะไรเพิ่ม — ถ้าไม่ได้ตั้ง `MONGODB_URI` แอปจะใช้ mock data ในหน่วยความจำให้เอง:

```bash
bun run dev
```

หน้าแรกจะขึ้นแถบ **Mock Mode** สีเหลือง แก้ข้อมูลได้ปกติ (เพิ่ม/ลบรายการ, ติ๊กว่าจ่ายแล้ว)
แต่ข้อมูลอยู่แค่ใน process ของ server:

- หายเมื่อรีสตาร์ท server
- ไม่ได้แชร์ข้ามหลาย worker/instance

พอพร้อมเก็บข้อมูลจริงก็ใส่ `MONGODB_URI` ใน `.env.local` แล้วรีสตาร์ท dev server

## วิธีเช็คว่าแก้สำเร็จ

1. รีเฟรชเบราว์เซอร์ที่ http://localhost:3000
2. **ถ้าสำเร็จ**: จะเห็นหน้า "เริ่มต้นใช้งาน" (ยังไม่มีสมาชิก) หรือรายการค่าใช้จ่าย (ถ้ามี data)
3. **ถ้ายัง error**: เช็ค console ใน terminal ว่ามี error อะไร

## การตรวจสอบ

เปิด Browser Console (F12) แล้วดู:
- **200 OK**: MongoDB เชื่อมต่อสำเร็จ
- **500 Error**: MongoDB ยังเชื่อมต่อไม่ได้

---

**หลังจากแก้เสร็จแล้ว** คุณสามารถ:
1. เพิ่มสมาชิกในกลุ่ม
2. เพิ่มรายการค่าใช้จ่าย
3. ดูสรุปโอนเงินและติ๊กว่าจ่ายแล้ว

ต้องการความช่วยเหลือเพิ่มเติม? ให้ฉันรู้!
