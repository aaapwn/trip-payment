# Project Summary - Trip Payment

## 📋 ภาพรวมโปรเจค

ระบบจัดการและคำนวณการหารค่าใช้จ่ายในทริปสำหรับเพื่อนๆ ที่ไปเที่ยวด้วยกัน พัฒนาด้วย Next.js 16, MongoDB, และ Tailwind CSS ด้วยการออกแบบแบบ Refined Minimalism

## ✨ คุณสมบัติหลัก

### 1. จัดการทริป
- สร้างทริปใหม่พร้อมชื่อและสมาชิก
- แต่ละสมาชิกมีสีประจำตัวสำหรับจำแนก
- ดูรายการทริปทั้งหมดพร้อมสรุปข้อมูล

### 2. บันทึกค่าใช้จ่าย
- เพิ่มรายการค่าใช้จ่ายพร้อมรายละเอียด
- ระบุผู้จ่ายและผู้ร่วมแชร์ได้อย่างยืดหยุ่น
- ลบรายการที่ผิดพลาดได้
- แสดงจำนวนเงินต่อคน

### 3. คำนวณอัตโนมัติ
- คำนวณยอดคงเหลือของแต่ละคนแบบเรียลไทม์
- สรุปว่าใครต้องโอนให้ใครเท่าไหร่
- ใช้อัลกอริทึมลดจำนวนการโอนให้น้อยที่สุด

### 4. สถิติและสรุป
- ยอดรวมทั้งหมดของทริป
- ยอดจ่าย ยอดค้าง และยอดสุทธิของแต่ละคน
- แสดงสถานะว่าใครได้เงินคืนหรือต้องจ่าย

## 🎨 Design Highlights

### Visual Design
- **Color Palette**: OKLCH color space สำหรับความสม่ำเสมอ
  - Primary: Blue (250°) สำหรับ CTA
  - Accent: Green (140°) สำหรับยอดบวก
  - Destructive: Red (25°) สำหรับยอดลบ
  - Warm neutrals มี undertone (hue 85°)

- **Typography**: 
  - Inter สำหรับ body text
  - DM Serif Display สำหรับ headings และตัวเลข
  - Fluid sizing ที่ปรับตามหน้าจอ

- **Layout**:
  - Generous whitespace
  - Card-based design
  - Responsive grid (mobile → tablet → desktop)

### Interaction Design
- Progressive disclosure (overview → detail)
- Hover states สำหรับ feedback
- Empty states ที่ให้คำแนะนำ
- Loading states ด้วย skeleton UI

## 🏗️ สถาปัตยกรรม

### Tech Stack
```
Frontend:
├── Next.js 16 (App Router)
├── React 19
├── TypeScript
└── Tailwind CSS v4

UI Components:
├── shadcn/ui
└── Lucide Icons

Backend:
├── Next.js API Routes
└── MongoDB + Mongoose

Runtime:
└── Bun
```

### Database Schema

**Trip Model:**
```typescript
{
  name: string
  members: [
    { id, name, color }
  ]
  expenses: [
    { description, amount, paidBy, splitWith[], date }
  ]
  createdAt: Date
  updatedAt: Date
}
```

### API Endpoints

```
GET    /api/trips          # ดึงรายการทริปทั้งหมด
POST   /api/trips          # สร้างทริปใหม่
GET    /api/trips/[id]     # ดึงข้อมูลทริป
PATCH  /api/trips/[id]     # อัปเดตทริป (เพิ่ม/ลบ expense)
DELETE /api/trips/[id]     # ลบทริป
```

## 📂 โครงสร้างไฟล์

```
trip-payment/
├── src/
│   ├── app/
│   │   ├── api/trips/              # API routes
│   │   ├── trips/[id]/             # Trip detail page
│   │   ├── page.tsx                # Home page
│   │   ├── loading.tsx             # Loading state
│   │   ├── error.tsx               # Error boundary
│   │   ├── not-found.tsx           # 404 page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles + design tokens
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── TripCard.tsx            # Trip list item
│   │   ├── NewTripDialog.tsx       # Create trip form
│   │   ├── ExpenseList.tsx         # Expense items
│   │   ├── SettlementSummary.tsx   # Payment summary
│   │   ├── MemberStats.tsx         # Per-member stats
│   │   └── AddExpenseDialog.tsx    # Add expense form
│   │
│   ├── lib/
│   │   ├── mongodb.ts              # DB connection
│   │   ├── calculations.ts         # Settlement algorithm
│   │   └── utils.ts                # Utilities
│   │
│   └── models/
│       └── Trip.ts                 # Mongoose schema
│
├── scripts/
│   └── seed.ts                     # Seed sample data
│
├── .env.local                      # Environment variables
├── .env.local.example              # Example env file
├── .gitignore
├── package.json
├── README.md                       # Full documentation
├── QUICKSTART.md                   # Quick start guide
├── DESIGN.md                       # Design documentation
└── PROJECT_SUMMARY.md              # This file
```

## 🧮 Settlement Algorithm

อัลกอริทึม Greedy สำหรับคำนวณการชำระเงิน:

1. **Calculate Balances** - คำนวณยอดคงเหลือของแต่ละคน
   ```
   balance[person] = total_paid - total_owed
   ```

2. **Separate Groups** - แบ่งเป็น creditors (บวก) และ debtors (ลบ)
   ```
   creditors: คนที่มียอดบวก (ได้เงินคืน)
   debtors: คนที่มียอดลบ (ต้องจ่าย)
   ```

3. **Greedy Matching** - จับคู่เพื่อลดจำนวนการโอน
   ```
   for each debtor:
     for each creditor:
       settlement_amount = min(debt, credit)
       create settlement(debtor → creditor, amount)
       update remaining debt and credit
   ```

**ผลลัพธ์**: จำนวนการโอนเงินน้อยที่สุดที่ทำให้ทุกคนเท่ากัน

## 🎯 Design Principles

### 1. Clarity over Cleverness
- เน้นความชัดเจนของข้อมูล
- ไม่ใช้ decoration ที่ไม่จำเป็น
- Typography hierarchy ที่ชัดเจน

### 2. Refinement over Decoration
- Subtle effects แทน flashy animations
- Quality over quantity
- Purposeful whitespace

### 3. Function First
- UI ออกแบบรอบการใช้งาน
- ทุก element มีจุดประสงค์
- ไม่มี unnecessary elements

## 🚀 การใช้งาน

### Development
```bash
bun install
bun run dev
```

### Production
```bash
bun run build
bun run start
```

### Seeding Data
```bash
bun run seed
```

## 📊 Performance Considerations

- **Database**: Single-document design สำหรับทริป (ไม่ต้อง join)
- **API**: REST API ที่เรียบง่าย
- **Client**: Client-side calculation สำหรับ instant feedback
- **Caching**: MongoDB connection caching
- **Images**: ไม่มีรูปภาพใช้ Lucide icons แทน

## 🔒 Security Notes

- MongoDB connection ผ่าน environment variables
- ไม่มี authentication (สมมติใช้ในกลุ่มปิด)
- Input validation ด้วย Mongoose schema
- Client-side validation ก่อน submit

## 🎨 What Makes It NOT AI Slop

✅ **Distinctive Design Choices:**
1. Serif font สำหรับตัวเลขและ headings (ไม่ใช่ monospace)
2. Warm undertone ใน neutral colors (ไม่ใช่ pure gray)
3. Purposeful whitespace และ spacing rhythm
4. Color-coded members แทน generic avatars
5. Single-purpose components (ไม่ใช่ card grid ซ้ำๆ)

❌ **Avoided AI Clichés:**
- ไม่มี glassmorphism / blur effects
- ไม่มี gradient text everywhere
- ไม่มี glow effects / neon colors
- ไม่มี dashboard metrics template
- ไม่มี sparklines as decoration

## 📈 Future Enhancements

Possible improvements:
- [ ] Export ข้อมูลเป็น PDF/Excel
- [ ] Multi-currency support
- [ ] Split by percentage (ไม่เท่ากัน)
- [ ] Receipt photo upload
- [ ] Push notifications สำหรับ reminders
- [ ] QR code สำหรับ PromptPay
- [ ] Trip templates
- [ ] Historical analytics

## 📝 Notes

- โปรเจคนี้เน้น local-first approach (เหมาะกับกลุ่มเล็ก)
- ไม่มี authentication จงใช้ใน trusted environment
- Design มุ่งเน้น clarity และ usability
- Code structure ง่ายต่อการ maintain

---

**Design Principle**: "Clarity over cleverness, refinement over decoration"

Built with ❤️ for friends who love to travel together
