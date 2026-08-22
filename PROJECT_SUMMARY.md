# Project Summary - Trip Payment

## 📋 ภาพรวมโปรเจค

ระบบจัดการและคำนวณการหารค่าใช้จ่ายในทริปสำหรับเพื่อนๆ ที่ไปเที่ยวด้วยกัน พัฒนาด้วย Next.js 16, MongoDB, และ Tailwind CSS ด้วยการออกแบบแบบ Refined Minimalism

## ✨ คุณสมบัติหลัก

### 1. จัดการสมาชิก
- ระบบทำงานบนกลุ่มเดียว (single group) ไม่มีการแยกทริป
- แต่ละสมาชิกมีสีประจำตัวสำหรับจำแนก
- ลบสมาชิกได้เฉพาะคนที่ยังไม่มีรายการค่าใช้จ่ายอ้างถึง เพื่อไม่ให้ยอดรวมกับสรุปรายคนไม่ตรงกัน

### 2. บันทึกค่าใช้จ่าย
- เพิ่ม แก้ไข ลบรายการค่าใช้จ่ายพร้อมรายละเอียดและวันที่
- ระบุผู้จ่ายและผู้ร่วมแชร์ได้อย่างยืดหยุ่น
- รองรับรายการเงินคืนด้วยยอดติดลบ (กลับทิศการจ่าย)
- แสดงจำนวนเงินต่อคน

### 3. คำนวณอัตโนมัติ
- สรุปว่าใครต้องโอนให้ใครเท่าไหร่ แยกตามคนและตามรายการ
- คิดหนี้แบบรายคู่ (gross) ไม่หักลบหนี้สองทาง เพื่อให้ตามกลับไปที่รายการต้นทางได้
- ติ๊กว่าจ่ายแล้วได้ โดยเก็บเป็นจำนวนเงินที่โอนจริง

### 4. สถิติและสรุป
- ยอดรวมทั้งหมดของกลุ่ม
- ยอดจ่าย ส่วนแบ่งที่ต้องจ่าย และคงเหลือสุทธิ (หลังหักที่โอนกันแล้ว)
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

**Group Model** (เอกสารเดียวต่อกลุ่ม):
```typescript
{
  members: [
    { id, name, color }
  ]
  expenses: [
    { description, amount, paidBy, splitWith[], date }
  ]
  paidSettlements: [
    { from, to, amount, paidAt }   // ยอดที่โอนจริงต่อคู่
  ]
  createdAt: Date
  updatedAt: Date                  // ใช้เป็น optimistic-concurrency token
}
```

### API Endpoints

```
GET    /api/group          # ดึงข้อมูลกลุ่ม (สร้างกลุ่มเปล่าให้ถ้ายังไม่มี)
PATCH  /api/group          # อัปเดต members / expenses / paidSettlements
```

`PATCH` ตรวจ body ด้วย zod แบบ strict และรับ `expectedUpdatedAt`:
- คีย์ที่ไม่รู้จักถูกปฏิเสธ (`400`) จึงยิง MongoDB operator เข้ามาไม่ได้
- ข้อมูลที่ทำให้ members กับ expenses ไม่สอดคล้องกันถูกปฏิเสธ (`400`)
- ถ้ามีคนอื่นแก้ข้อมูลไปก่อน จะได้ `409` พร้อมข้อมูลล่าสุด แทนที่จะเขียนทับของคนอื่น

## 📂 โครงสร้างไฟล์

```
trip-payment/
├── src/
│   ├── app/
│   │   ├── api/group/route.ts      # API route
│   │   ├── settlements/            # สรุปโอนเงิน (+ select/)
│   │   ├── receivables/            # เงินที่ต้องได้รับ (+ select/)
│   │   ├── stats/                  # สถิติแต่ละคน
│   │   ├── page.tsx                # Home page
│   │   ├── loading.tsx             # Loading state
│   │   ├── error.tsx               # Error boundary
│   │   ├── not-found.tsx           # 404 page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles + design tokens
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── AppSidebar.tsx          # Sidebar / mobile nav
│   │   ├── ExpenseList.tsx         # Expense items
│   │   ├── AddExpenseDialog.tsx    # Add / edit expense form
│   │   ├── ManageMembersDialog.tsx # Manage members
│   │   └── SettlementSummary.tsx   # Netted view (ไม่ได้ใช้ในหน้าหลัก)
│   │
│   ├── lib/
│   │   ├── mongodb.ts              # DB connection
│   │   ├── api.ts                  # Client helper
│   │   ├── settlements.ts          # Pairwise debts + paid amounts
│   │   ├── calculations.ts         # Netting helper
│   │   ├── validation.ts           # zod schemas
│   │   └── utils.ts                # Utilities
│   │
│   └── models/
│       └── Group.ts                # Mongoose schema
│
├── scripts/
│   └── seed.ts                     # Seed sample data
│
├── .github/workflows/ci.yml        # lint + typecheck + test + build
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

## 🧮 Settlement Logic

หน้าจอหลักใช้หนี้แบบ **รายคู่ต่อรายการ (gross)** — `src/lib/settlements.ts`

1. **Build pairs** - ทุกรายการหารเท่าๆ กันตาม `splitWith` แล้วสร้างหนี้ทิศทางเดียว
   ```
   for each expense:
     share = amount / splitWith.length
     for each member in splitWith (ยกเว้นคนจ่าย):
       debt[member → payer] += share      // ยอดติดลบ = เงินคืน, กลับทิศ
   ```

2. **ไม่หักลบสองทาง** - A ค้าง B และ B ค้าง A จะแสดงแยกกัน (ตั้งใจ เพื่อให้ตามรายการต้นทางได้)

3. **Paid amounts** - `paidSettlements` เก็บยอดที่โอนจริงต่อคู่
   ```
   outstanding = max(total - paidAmount, 0)
   settled     = paidAmount >= total
   ```
   รายการใหม่ที่เพิ่มมาทีหลังจึงกลายเป็นยอดค้างส่วนต่าง ไม่ใช่ลบเครื่องหมายที่ติ๊กไว้ทิ้ง

> `src/lib/calculations.ts` ยังมีอัลกอริทึม netting แบบ greedy (ลดจำนวนรอบโอน) ใช้ผ่าน `SettlementSummary`
> แต่หน้าจอหลักไม่ได้เรียกใช้

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

### Checks
```bash
bun run lint        # ESLint
bunx tsc --noEmit   # Typecheck
bun test            # Unit tests
```

## 📊 Performance Considerations

- **Database**: Single-document design สำหรับกลุ่ม (ไม่ต้อง join)
- **API**: REST API ที่เรียบง่าย
- **Client**: Client-side calculation สำหรับ instant feedback
- **Caching**: MongoDB connection caching
- **Images**: ไม่มีรูปภาพใช้ Lucide icons แทน

## 🔒 Security Notes

- MongoDB connection ผ่าน environment variables
- **ไม่มี authentication** — ใครเข้าถึง URL ได้ก็แก้ข้อมูลกลุ่มได้ ต้องใช้ในวงปิดเท่านั้น
- Server-side validation ด้วย zod แบบ strict (ปฏิเสธคีย์ที่ไม่รู้จัก จึงกัน MongoDB operator injection)
- Referential integrity check ระหว่าง members กับ expenses ตอนเขียน
- Optimistic concurrency ผ่าน `expectedUpdatedAt` กันการเขียนทับกันเอง
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
