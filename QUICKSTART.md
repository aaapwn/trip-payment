# 🚀 Quick Start Guide

เริ่มต้นใช้งานระบบ Trip Payment ในไม่กี่ขั้นตอน

## Prerequisites

ต้องมีสิ่งเหล่านี้ติดตั้งอยู่แล้ว:
- [Bun](https://bun.sh/) v1.0 ขึ้นไป
- [MongoDB](https://www.mongodb.com/) (Local หรือ Atlas)

## การติดตั้งแบบเร็ว

### 1. ติดตั้ง Dependencies

```bash
bun install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```bash
cp .env.local.example .env.local
```

แก้ไข MongoDB URI ตามที่ใช้งาน:

**ใช้ MongoDB Local:**
```env
MONGODB_URI=mongodb://localhost:27017/trip-payment
```

**ใช้ MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trip-payment?retryWrites=true&w=majority
```

### 3. (Optional) เพิ่มข้อมูลตัวอย่าง

```bash
bun run seed
```

จะสร้างกลุ่มตัวอย่าง 4 คนพร้อมรายการค่าใช้จ่าย (เขียนทับข้อมูลเดิมในกลุ่ม)

### 4. รันโปรเจค

```bash
bun run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000) 🎉

## การใช้งานพื้นฐาน

### เพิ่มสมาชิก

ระบบทำงานบนกลุ่มเดียว ไม่ต้องสร้างทริป

1. คลิกปุ่ม **"เพิ่มสมาชิก"** (หรือ "จัดการสมาชิก")
2. พิมพ์ชื่อแล้วกด **"เพิ่ม"** ทีละคน (ขั้นต่ำ 2 คน)
3. คลิก **"บันทึก"**

> คนที่มีรายการค่าใช้จ่ายอ้างถึงอยู่แล้วจะลบไม่ได้ (มีไอคอนกุญแจ) ต้องลบหรือแก้รายการนั้นก่อน

### เพิ่มรายการค่าใช้จ่าย

1. คลิก **"เพิ่ม"**
2. กรอกข้อมูล:
   - **รายการ**: ค่าที่พัก, ค่าอาหาร, ฯลฯ
   - **จำนวนเงิน**: ใส่เป็นบาท (ใส่ยอดติดลบได้ถ้าเป็นเงินคืน)
   - **วันที่**: แก้ได้ทั้งตอนเพิ่มและตอนแก้ไข
   - **จ่ายโดย**: เลือกคนที่จ่าย
   - **แชร์กับ**: ติ๊กเลือกคนที่จะหารเงิน
3. คลิก **"เพิ่มรายการ"**

### ดูสรุปการชำระเงิน

ระบบจะคำนวณอัตโนมัติและแสดง:

- **รายการค่าใช้จ่าย**: ทั้งหมดที่เพิ่มไว้
- **สรุปโอนเงิน**: ใครต้องโอนให้ใครเท่าไหร่ พร้อมติ๊กว่าจ่ายแล้ว
- **สถิติแต่ละคน**: ยอดจ่าย ยอดค้าง และยอดสุทธิ

## คำแนะนำการใช้งาน

### ✅ Best Practices

- **บันทึกทันที**: เพิ่มรายการทันทีหลังจ่ายเงิน ไม่ต้องรอจนกลับบ้าน
- **แชร์อย่างชัดเจน**: ระบุว่าใครแชร์ค่าใช้จ่ายนี้บ้าง (บางรายการไม่ต้องแชร์ทั้งกลุ่ม)
- **ใส่รายละเอียด**: ใส่ชื่อรายการให้ชัดเจน เช่น "ค่าที่พัก 2 คืน" แทน "ที่พัก"
- **เช็คสรุป**: ดูสรุปการชำระเงินก่อนโอน เพื่อให้แน่ใจว่าถูกต้อง

### 💡 Tips

- สามารถลบรายการที่ใส่ผิดได้ (hover แล้วคลิกถังขยะ)
- หนี้จะแยกเป็นรายคู่ต่อรายการ (ไม่หักลบหนี้สองทาง) เพื่อให้ตามกลับไปที่รายการต้นทางได้
- สีของแต่ละคนจะถูกกำหนดอัตโนมัติ ช่วยจำแนกได้ง่าย

## Troubleshooting

### ❌ "Cannot connect to MongoDB"

**วิธีแก้:**
- ตรวจสอบว่า MongoDB running อยู่ (ถ้าใช้ local)
- ตรวจสอบ connection string ใน `.env.local`
- ลอง ping MongoDB server

```bash
# ถ้าใช้ local MongoDB
mongosh

# หรือ
brew services list | grep mongodb
```

### ❌ Port 3000 is already in use

**วิธีแก้:**
- Next.js จะใช้ port อื่นให้อัตโนมัติ (เช่น 3001)
- หรือปิด process ที่ใช้ port 3000:

```bash
lsof -ti:3000 | xargs kill -9
```

### ❌ Module not found

**วิธีแก้:**
```bash
# ลบและติดตั้งใหม่
rm -rf node_modules
bun install
```

## สรุป Commands

```bash
# ติดตั้ง dependencies
bun install

# รัน development server
bun run dev

# สร้าง production build
bun run build

# รัน production server
bun run start

# เพิ่มข้อมูลตัวอย่าง
bun run seed

# ตรวจสอบ code style
bun run lint
```

## ต้องการความช่วยเหลือ?

- 📖 อ่าน [README.md](./README.md) สำหรับข้อมูลเพิ่มเติม
- 🎨 ดู [DESIGN.md](./DESIGN.md) สำหรับรายละเอียดการออกแบบ
- 💬 หรือสร้าง issue ใน GitHub repository

---

Happy trip planning! 🎒✈️
