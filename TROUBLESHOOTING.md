# 🚨 การแก้ปัญหา: trips.map is not a function

## สาเหตุ

Error นี้เกิดเพราะ **MongoDB ยังไม่ได้เชื่อมต่อ** ทำให้ API `/api/trips` return status 500 และส่ง error object กลับมาแทนที่จะเป็น array

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

ถ้าต้องการดู UI ก่อนโดยไม่ต้องติดตั้ง MongoDB:

**สร้าง Mock API** ที่ `/api/trips/route.ts`:

```typescript
import { NextResponse } from 'next/server';

// Mock data for testing
const mockTrips = [
  {
    _id: '1',
    name: 'ทริปเชียงใหม่ 2026',
    members: [
      { id: '1', name: 'กอล์ฟ', color: '#5B7FE8' },
      { id: '2', name: 'มิ้นต์', color: '#6BCF9E' },
    ],
    expenses: [
      {
        description: 'ค่าที่พัก',
        amount: 2000,
        paidBy: '1',
        splitWith: ['1', '2'],
        date: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET() {
  // Return mock data instead of database query
  return NextResponse.json(mockTrips);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ ...body, _id: Date.now().toString() }, { status: 201 });
}
```

## วิธีเช็คว่าแก้สำเร็จ

1. รีเฟรชเบราว์เซอร์ที่ http://localhost:3001
2. **ถ้าสำเร็จ**: จะเห็นหน้า "ยังไม่มีทริป" หรือรายการทริป (ถ้ามี data)
3. **ถ้ายัง error**: เช็ค console ใน terminal ว่ามี error อะไร

## การตรวจสอบ

เปิด Browser Console (F12) แล้วดู:
- **200 OK**: MongoDB เชื่อมต่อสำเร็จ
- **500 Error**: MongoDB ยังเชื่อมต่อไม่ได้

---

**หลังจากแก้เสร็จแล้ว** คุณสามารถ:
1. สร้างทริปใหม่ได้
2. เพิ่มรายการค่าใช้จ่าย
3. ดูสรุปการชำระเงิน

ต้องการความช่วยเหลือเพิ่มเติม? ให้ฉันรู้!
