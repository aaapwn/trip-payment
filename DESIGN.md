# Design Context - Trip Payment

## Overview

ระบบหารค่าใช้จ่ายในทริปสำหรับเพื่อนๆ ที่ต้องการบันทึกและคำนวณการแชร์ค่าใช้จ่ายอย่างชัดเจน

## Design Direction: Refined Minimalism

### Target Audience
- **ผู้ใช้หลัก**: เพื่อนๆ ที่ไปเที่ยวด้วยกัน
- **บริบท**: การใช้งานทั้งระหว่างทริปและหลังทริป
- **ความต้องการ**: ต้องการบันทึกรายการทันที และคำนวณยอดได้อย่างรวดเร็วแม่นยำ

### Brand Personality
- **เรียบหรู** (Clean & Professional) - ไม่ซับซ้อน มุ่งเน้นหน้าที่การใช้งาน
- **สงบ** - ใช้สีที่สบายตา ไม่ฉูดฉาด
- **ชัดเจน** - ข้อมูลทางการเงินต้องอ่านง่าย ไม่สับสน
- **เป็นมิตร** - แม้เป็นเรื่องเงิน แต่ไม่จริงจังจนเกินไป

## Visual Design

### Color Palette (OKLCH)

**Primary Colors:**
- **Blue (250°)**: `oklch(0.58 0.14 250)` - สีหลัก สำหรับ CTA และ interactive elements
- **Background**: `oklch(0.98 0.004 85)` - พื้นหลังที่มี warm undertone เล็กน้อย
- **Foreground**: `oklch(0.25 0.015 85)` - ตัวหนังสือหลัก

**Semantic Colors:**
- **Accent Green (140°)**: `oklch(0.88 0.08 140)` - สำหรับยอดที่ได้รับคืน (positive)
- **Destructive Red (25°)**: `oklch(0.62 0.22 25)` - สำหรับยอดที่ต้องจ่าย (negative)

**Neutral Tones:**
- ทุกสีเทาถูก tint ด้วย warm undertone (hue 85°) เพื่อให้ดู cohesive
- Border: `oklch(0.92 0.008 85)` - เส้นขอบที่นุ่มตา

**Rationale:**
- ใช้ OKLCH เพื่อความสม่ำเสมอทางการรับรู้
- สี Blue ให้ความรู้สึกเชื่อถือได้ เหมาะกับการเงิน
- Warm undertone ทำให้ interface ดูเป็นมิตรกว่าสี neutral แบบ pure gray

### Typography

**Primary Font: Inter**
- Clean, legible, professional
- ใช้สำหรับ body text, labels, UI elements
- Variable font รองรับ weight ต่างๆ

**Display Font: DM Serif Display**
- ใช้สำหรับ headings และตัวเลขที่สำคัญ (ยอดเงิน)
- เพิ่มความ refined และ distinctive
- ไม่ใช่ monospace เพื่อหลีกเลี่ยง "developer aesthetic"

**Type Scale:**
- Headings: 3xl (30px), 2xl (24px), xl (20px)
- Body: base (16px), sm (14px), xs (12px)
- ใช้ fluid sizing ผ่าน clamp() สำหรับ responsive

**Rationale:**
- Inter คือฟอนต์ที่อ่านง่าย แต่ไม่ใช่ default system font
- DM Serif เพิ่ม personality โดยไม่ overdone
- Serif สำหรับตัวเลขเงินทำให้ดู more considered

### Layout & Spacing

**Container:**
- Max-width: 5xl (1024px) สำหรับหน้าหลัก
- Max-width: 6xl (1152px) สำหรับหน้า detail (ต้องการพื้นที่มากกว่า)
- Padding: 6 (1.5rem) ทุกด้าน

**Spacing Scale:**
- Tight grouping: 2-3 (0.5-0.75rem)
- Section spacing: 6-8 (1.5-2rem)
- Component spacing: 12 (3rem)
- Generous whitespace เพื่อความชัดเจน

**Card Design:**
- Rounded corners: 0.75rem (เหมาะสมระหว่าง sharp และ overly rounded)
- Border: `border-border/50` - subtle border ไม่หนาจนเกินไป
- Hover: เพิ่ม shadow และ subtle transform
- ไม่ nest cards ใน cards

**Grid:**
- List view: single column สำหรับความชัดเจน
- Detail view: 3 columns (2 col content + 1 col sidebar) บน desktop

**Rationale:**
- ใช้ whitespace เพื่อ create visual rhythm
- Cards มี breathing room แต่ไม่ลอยจนเกินไป
- Layout ไม่ซับซ้อน เน้นความชัดเจนของข้อมูล

### Components

**Buttons:**
- Primary: filled, rounded corners, subtle shadow
- Secondary: outline
- Ghost: สำหรับ secondary actions
- ไม่ใช้ gradient หรือ glow effects

**Badges:**
- ใช้สีของสมาชิกแต่ละคน (10 preset colors)
- Background: `{color}15` (15% opacity)
- Border: `{color}30` (30% opacity)
- ดู cohesive และแยกแยะได้ง่าย

**Cards:**
- ไม่ใช้ glassmorphism หรือ heavy shadows
- Border + subtle background
- Hover state: shadow-lg + smooth transition

**Rationale:**
- Components ออกแบบเพื่อความชัดเจน ไม่ใช่เพื่อ decoration
- สีของ badges ช่วยจำแนกสมาชิกได้ง่าย
- Minimal style ไม่ distract จากข้อมูล

### Motion

**Principles:**
- Purposeful, not decorative
- Subtle, not attention-grabbing
- Fast (200-400ms)

**Used for:**
- Page transitions: fade + slight translateY
- Card hover: shadow + scale
- Button interactions: opacity + subtle scale
- Loading states: pulse animation

**Easing:**
- `ease-out` สำหรับ transitions ทั่วไป
- `transition-all duration-200/300` สำหรับ hover states

**Rationale:**
- Motion เพื่อ feedback ไม่ใช่ showoff
- Fast timing เพื่อไม่ให้รู้สึกช้า
- ไม่ใช้ bounce/elastic เพราะดู dated

### Interaction Patterns

**Progressive Disclosure:**
- หน้าหลัก: แสดงเฉพาะ overview (ชื่อทริป, จำนวนคน, ยอดรวม)
- หน้า detail: แสดงรายละเอียดเต็ม
- Hover: แสดง delete button

**Empty States:**
- Icon + Heading + Description + CTA
- ให้คำแนะนำว่าควรทำอะไรต่อ
- ไม่แค่บอกว่า "empty"

**Forms:**
- Labels ชัดเจน
- Validation real-time
- Disabled state สำหรับ invalid input
- Loading state สำหรับ async actions

**Numbers:**
- แสดงทศนิยม 2 ตำแหน่งสำหรับเงิน
- ใช้ toLocaleString('th-TH') สำหรับ thousands separator
- Serif font สำหรับตัวเลขสำคัญ

**Rationale:**
- ผู้ใช้ไม่ต้องคิดเยอะ ระบบบอกว่าต้องทำอะไร
- ตัวเลขเงินต้องแม่นยำและอ่านง่าย
- Progressive disclosure ไม่ให้ข้อมูลท่วมหน้า

## Responsive Design

**Breakpoints:**
- Mobile: < 640px - single column
- Tablet: 640px - 1024px - adjusted spacing
- Desktop: > 1024px - full layout with sidebar

**Mobile Adaptations:**
- Stack layout vertically
- Reduce padding
- Larger touch targets (min 44px)
- Simplified navigation

**Rationale:**
- ใช้งานบนมือถือระหว่างทริป
- Desktop สำหรับ review และสรุป

## What Makes This Design Distinctive

### Not AI Slop Because:
- ✅ ใช้ serif font สำหรับตัวเลขและ headings (ไม่ใช่ monospace)
- ✅ สีมี warm undertone (ไม่ใช่ pure gray)
- ✅ Layout ที่มี purpose (ไม่ใช่ card grid ซ้ำๆ)
- ✅ Typography hierarchy ชัดเจน (ไม่ใช่ size เดียวทั้งหมด)
- ✅ Badges ใช้สีของสมาชิก (ไม่ใช่ gradient ทุกอัน)
- ✅ ไม่มี: glassmorphism, glow effects, gradient text, sparklines

### Key Differentiators:
1. **Serif for Important Numbers** - เพิ่มความ refined และ trustworthy
2. **Color-coded Members** - ช่วยจำแนกสมาชิกอย่างรวดเร็ว
3. **Generous Whitespace** - ไม่ cramped ข้อมูลชัดเจน
4. **Warm Neutrals** - ไม่เย็นจัดเหมือน typical corporate app
5. **Purposeful Hierarchy** - ข้อมูลสำคัญโดดเด่น

## Implementation Notes

- ใช้ Next.js 16 App Router
- Tailwind CSS v4 (inline theme variables)
- OKLCH color space สำหรับความสม่ำเสมอ
- Fluid spacing ด้วย Tailwind scale
- shadcn/ui components สำหรับ base
- Custom styling เพื่อ match design direction

---

**Design Principle**: "Clarity over cleverness, refinement over decoration"
