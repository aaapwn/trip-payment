# หารตัง - ระบบแชร์ค่าใช้จ่าย

ระบบคำนวณการแชร์ค่าใช้จ่ายสำหรับกลุ่มเพื่อน บันทึกรายการและคำนวณว่าใครต้องจ่ายใครเท่าไหร่

## ✨ คุณสมบัติ

- 📝 **บันทึกรายการค่าใช้จ่าย** - เพิ่ม แก้ไข ลบรายการได้ (รวมรายการเงินคืนด้วยยอดติดลบ)
- 👥 **จัดการสมาชิก** - เพิ่มสมาชิกได้ ลบได้เฉพาะคนที่ยังไม่มีรายการค่าใช้จ่าย
- 🧮 **คำนวณอัตโนมัติ** - แยกตามคนว่าต้องจ่ายคืนใครเท่าไหร่
- ✅ **ติ๊กว่าจ่ายแล้ว** - บันทึกยอดที่โอนจริง ไม่หลุดเมื่อมีรายการใหม่เข้ามา
- 📊 **สถิติแต่ละคน** - ยอดจ่าย ส่วนแบ่ง และคงเหลือสุทธิหลังหักที่โอนกันแล้ว
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
- **รายการค่าใช้จ่ายทั้งหมด** (`/`) - เรียงตามวันที่
- **สรุปโอนเงิน** (`/settlements`) - แยกตามคน ว่าต้องจ่ายคืนใครเท่าไหร่ พร้อมช่องติ๊กว่าจ่ายแล้ว
- **เงินที่ต้องได้รับ** (`/receivables`) - ใครยังไม่โอนคืนเรา และค้างอยู่เท่าไหร่
- **สถิติแต่ละคน** (`/stats`) - ยอดจ่าย ส่วนแบ่งที่ต้องจ่าย และคงเหลือสุทธิ

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

## 🧮 การคำนวณ

หน้าสรุปคิด **หนี้แบบรายคู่ต่อรายการ (gross)** — ตั้งใจให้เป็นแบบนี้เพื่อให้ตามกลับไปที่รายการต้นทางได้:

1. แต่ละรายการ ยอดจะถูกหารเท่าๆ กันตามคนใน `splitWith`
2. ทุกคนที่ร่วมหาร (ยกเว้นคนจ่าย) เป็นหนี้คนที่ออกเงินไปเท่ากับส่วนแบ่งของตัวเอง
3. รายการยอดติดลบ (เงินคืน) จะกลับทิศ — คนที่รับเงินคืนมาเป็นคนที่ต้องจ่ายให้คนอื่น
4. หนี้คนละทิศระหว่างคนสองคน **ไม่ถูกหักลบกัน** เช่น A ค้าง B 500 และ B ค้าง A 300 จะแสดงทั้งสองรายการ

ยอดที่ติ๊กว่า "จ่ายแล้ว" ถูกเก็บเป็น**จำนวนเงินที่โอนจริง** ต่อคู่ ดังนั้นถ้ามีรายการใหม่เพิ่มเข้ามาทีหลัง
เครื่องหมายที่ติ๊กไว้จะไม่หาย แต่จะกลายเป็นยอด "ค้างจ่าย" ส่วนต่างแทน

> `src/lib/calculations.ts` มีฟังก์ชัน netting (greedy, ลดจำนวนรอบโอน) พร้อมใช้อยู่ แต่หน้าจอหลักไม่ได้ใช้
> — ใช้ผ่าน `SettlementSummary` ถ้าต้องการมุมมองแบบหักลบ

## 📁 โครงสร้างโปรเจค

```
trip-payment/
├── src/
│   ├── app/
│   │   ├── api/group/route.ts      # GET / PATCH ข้อมูลกลุ่ม
│   │   ├── settlements/            # สรุปโอนเงิน (+ select/ เลือกคน)
│   │   ├── receivables/            # เงินที่ต้องได้รับ (+ select/)
│   │   ├── stats/                  # สถิติแต่ละคน
│   │   ├── layout.tsx              # Root layout + sidebar
│   │   ├── page.tsx                # รายการค่าใช้จ่าย
│   │   ├── loading.tsx / error.tsx / not-found.tsx
│   │   └── globals.css             # Global styles + design tokens
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── AppSidebar.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── AddExpenseDialog.tsx
│   │   ├── ManageMembersDialog.tsx
│   │   └── SettlementSummary.tsx   # มุมมองแบบหักลบ (ไม่ได้ใช้ในหน้าหลัก)
│   ├── lib/
│   │   ├── mongodb.ts              # Database connection
│   │   ├── api.ts                  # Client helper (+ optimistic concurrency)
│   │   ├── settlements.ts          # หนี้รายคู่ + ยอดที่จ่ายแล้ว
│   │   ├── calculations.ts         # Netting helper
│   │   ├── validation.ts           # zod schema สำหรับ API
│   │   └── utils.ts
│   └── models/
│       └── Group.ts                # Mongoose schema
├── scripts/seed.ts                 # ใส่ข้อมูลตัวอย่าง
├── .github/workflows/ci.yml        # lint + typecheck + test + build
├── .env.local.example
├── package.json
└── README.md
```

## 🔌 API

| Method | Path | หมายเหตุ |
| --- | --- | --- |
| `GET` | `/api/group` | ข้อมูลกลุ่มทั้งก้อน (สร้างกลุ่มเปล่าให้ถ้ายังไม่มี) |
| `PATCH` | `/api/group` | อัปเดต `members`, `expenses`, `paidSettlements` |

`PATCH` ตรวจ body ด้วย zod แบบ strict (คีย์ที่ไม่รู้จักถูกปฏิเสธ จึงยิง MongoDB operator เข้ามาไม่ได้) และรับ
`expectedUpdatedAt` เป็น optimistic-concurrency token — ถ้ามีคนอื่นแก้ข้อมูลไปก่อนจะได้ `409` กลับมาพร้อมข้อมูลล่าสุด
แทนที่จะเขียนทับของคนอื่น

## 🧪 ตรวจสอบโค้ด

```bash
bun run lint        # ESLint
bunx tsc --noEmit   # Typecheck
bun test            # Unit tests (logic การหารหนี้ + validation)
```

CI บน GitHub Actions รันทั้งสี่อย่าง (รวม `bun run build`) ทุก push เข้า `main` และทุก pull request

## 🚀 Production Build

```bash
# Build
bun run build

# Start production server
bun run start
```

## 🐳 Docker

### รันพร้อม MongoDB ด้วย compose (แนะนำ)

```bash
docker compose up --build
```

เปิด http://localhost:3000 — compose จะยก MongoDB ขึ้นให้ (เก็บข้อมูลใน volume `mongo-data`)
และตั้ง `MONGODB_URI=mongodb://mongo:27017/trip-payment` ให้ container ของแอปเอง

หยุด: `docker compose down` (เพิ่ม `-v` ถ้าจะลบข้อมูลใน DB ทิ้งด้วย)

อยากใส่ข้อมูลตัวอย่าง: uncomment `ports` ของ service `mongo` ใน `docker-compose.yml` แล้วรันจากเครื่องตัวเอง

```bash
MONGODB_URI=mongodb://localhost:27017/trip-payment bun run seed
```

### build/run image เดี่ยว

```bash
docker build -t trip-payment .

# ต่อ MongoDB ที่มีอยู่แล้ว
docker run -p 3000:3000 -e MONGODB_URI=<connection-string> trip-payment

# หรือรันเปล่า ๆ ได้เลย — ไม่มี MONGODB_URI จะเข้า mock mode
docker run -p 3000:3000 trip-payment
```

Image เป็น multi-stage: ติดตั้ง deps และ build ด้วย Bun แล้วรัน `.next/standalone` (`output: 'standalone'`)
บน `node:22-alpine` ที่ไม่มี `node_modules` ก้อนใหญ่ติดมา — runtime stage ประมาณ 60 MB และรันด้วย user `nextjs`
ไม่ใช่ root

`MONGODB_URI` ถูกอ่านตอน request ไม่ใช่ตอน build จึงใช้ image ก้อนเดียวข้าม environment ได้
ปรับ port/host ได้ด้วย `PORT` และ `HOSTNAME`

## 📝 License

MIT

---

สร้างด้วย ❤️ สำหรับเพื่อนๆ ที่ชอบไปเที่ยวด้วยกัน
