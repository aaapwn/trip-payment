# หารตัง - ระบบแชร์ค่าใช้จ่าย

ระบบคำนวณการแชร์ค่าใช้จ่ายสำหรับกลุ่มเพื่อน บันทึกรายการและคำนวณว่าใครต้องจ่ายใครเท่าไหร่

## ✨ คุณสมบัติ

- 📝 **บันทึกรายการค่าใช้จ่าย** - เพิ่มรายการใหม่ได้ทันที
- 👥 **จัดการสมาชิก** - เพิ่มลดสมาชิกในกลุ่มได้
- 🧮 **คำนวณอัตโนมัติ** - คำนวณว่าใครต้องจ่ายใครเท่าไหร่แบบเรียลไทม์
- 📊 **สถิติแต่ละคน** - ดูยอดจ่ายและยอดค้างของแต่ละคน
- 💫 **UI สวยงาม** - Minimal design สีสบายตา ใช้งานง่าย

## 🛠️ เทคโนโลยี

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **Database**: MongoDB + Mongoose
- **Runtime**: Bun
- **Styling**: OKLCH color space, fluid typography

## 📦 การติดตั้ง

### 1. Clone โปรเจค

```bash
git clone <repository-url>
cd trip-payment
```

### 2. ติดตั้ง Dependencies

```bash
bun install
```

### 3. รันโปรเจค (ทดสอบได้ทันที!)

```bash
bun run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

**หมายเหตุ**: โปรเจคจะใช้ **Mock Data** ในการทดสอบ ข้อมูลจะหายเมื่อรีสตาร์ท server

### 4. (Optional) ตั้งค่า Database จริง

ถ้าต้องการเก็บข้อมูลถาวร:

**Option A: MongoDB Local**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Free Cloud)**
1. สมัครที่ https://www.mongodb.com/cloud/atlas/register
2. สร้าง Free cluster
3. Get connection string

จากนั้นสร้างไฟล์ `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/trip-payment
# หรือ
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trip-payment
```

รีสตาร์ท dev server:
```bash
bun run dev
```

**อ่านเพิ่มเติม**: ดู [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) สำหรับคำแนะนำโดยละเอียด

## 📖 วิธีใช้งาน

### เริ่มต้นใช้งาน

1. **เพิ่มสมาชิก**
   - กดปุ่ม "เพิ่มสมาชิก"
   - ใส่ชื่อสมาชิกในกลุ่ม (อย่างน้อย 2 คน)
   - กดบันทึก

### เพิ่มรายการค่าใช้จ่าย

1. กดปุ่ม **"เพิ่มรายการ"**
2. ใส่รายละเอียด:
   - ชื่อรายการ (เช่น ค่าอาหาร, ค่าที่พัก)
   - จำนวนเงิน
   - คนที่จ่ายเงิน
   - เลือกว่าจะแชร์กับใคร
3. กดเพิ่มรายการ

### ดูสรุปการชำระเงิน

ระบบจะคำนวณและแสดง:
- **รายการค่าใช้จ่ายทั้งหมด** - เรียงตามวันที่
- **สรุปการชำระเงิน** - ใครต้องโอนให้ใครเท่าไหร่ (ลดจำนวนการโอนให้น้อยที่สุด)
- **สถิติแต่ละคน** - ยอดจ่าย ยอดค้าง และยอดสุทธิ

## 🎨 Design System

### สีหลัก (OKLCH)

- **Primary**: Blue tone (250°) - สีหลักของระบบ
- **Accent**: Green tone (140°) - สำหรับยอดได้รับคืน
- **Destructive**: Red tone (25°) - สำหรับยอดต้องจ่าย
- **Background**: Warm neutral - พื้นหลังสีอบอุ่นเล็กน้อย

### Typography

- **Sans-serif**: Inter - ฟอนต์หลักที่อ่านง่าย
- **Serif**: DM Serif Display - สำหรับหัวข้อและตัวเลขสำคัญ

### Spacing & Rhythm

- Fluid spacing ที่ปรับตามขนาดหน้าจอ
- Generous whitespace สำหรับความชัดเจน
- Card-based layout พร้อม subtle shadows

## 🧮 อัลกอริทึมการคำนวณ

ระบบใช้อัลกอริทึม **Greedy Algorithm** ในการคำนวณการชำระเงิน:

1. คำนวณยอดคงเหลือของแต่ละคน (ยอดจ่าย - ยอดค้าง)
2. แบ่งเป็น 2 กลุ่ม: คนที่ได้เงินคืน (creditors) และคนที่ต้องจ่าย (debtors)
3. จับคู่เพื่อลดจำนวนการโอนให้น้อยที่สุด

ผลลัพธ์: การโอนเงินที่มีจำนวนรอบน้อยที่สุดเพื่อให้ทุกคนเท่ากัน

## 📁 โครงสร้างโปรเจค

```
trip-payment/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── trips/          # API routes
│   │   ├── trips/
│   │   │   └── [id]/           # Trip detail page
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── TripCard.tsx
│   │   ├── NewTripDialog.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── SettlementSummary.tsx
│   │   ├── MemberStats.tsx
│   │   └── AddExpenseDialog.tsx
│   ├── lib/
│   │   ├── mongodb.ts          # Database connection
│   │   ├── calculations.ts     # Settlement algorithm
│   │   └── utils.ts
│   └── models/
│       └── Trip.ts             # Mongoose models
├── .env.local                  # Environment variables
├── package.json
└── README.md
```

## 🚀 Production Build

```bash
# Build
bun run build

# Start production server
bun run start
```

## 📝 License

MIT

---

สร้างด้วย ❤️ สำหรับเพื่อนๆ ที่ชอบไปเที่ยวด้วยกัน
