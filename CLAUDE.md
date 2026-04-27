# CLAUDE.md — مرجع المساعد الذكي لمشروع "بيتي"

> هذا الملف هو **القانون الأول** لأي مساعد ذكي يعمل على المشروع.
> اقرأه بالكامل قبل أي تعديل على الكود.

---

## 🎯 ماهية المشروع

**"بيتي"** — منصة سعودية لإدارة المنزل العائلي، تجمع:
1. **التنظيم:** فواتير، مهام دورية، مشتريات، صيانة، أرشيف ضمانات
2. **التربية:** اقتصاد البيت للأطفال (٤-١٢ سنة) — منيو أعمال + محفظة + ادخار + صدقة
3. **العائلة:** Multi-household + أدوار + Telegram bot

**الجمهور المستهدف:** العائلة السعودية والخليجية. اللغة الأساسية: العربية. RTL أصيل.

**حالة المشروع:** ما زال في مرحلة الـ MVP (٧ أسابيع — ٤٨ يوم).

---

## 📐 المراجع الأساسية للقراءة

قبل أي عمل، ارجع لهذه الملفات بالترتيب:

1. **`EXECUTION_PLAN_V2.md`** — خطة التنفيذ الكاملة (مرجعية، ليس draft)
2. **`EXTRACTED_FEATURES.md`** — ميزات مستخرجة من المشاريع المفتوحة (Grocy, HomeHub, Splitastic, Homechart)
3. **`DEV_LOG.md`** — سجل ما تم تنفيذه فعلياً + القرارات
4. **`ARCHITECTURE.md`** — تفاصيل المعمارية (يُنشأ في اليوم ١)
5. **`SECURITY.md`** — سياسة الأمن (يُنشأ في اليوم ١)

---

## 🚨 القواعد الذهبية (لا تكسرها أبداً)

### 1. الأرقام العربية — قاعدة صارمة

**المسموح:** `0 1 2 3 4 5 6 7 8 9` (الأرقام العربية الأصلية، U+0030 - U+0039)

**الممنوع منعاً باتاً:**
- ❌ `٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩` (الأرقام الهندية، U+0660 - U+0669)
- ❌ `۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹` (الأرقام الفارسية، U+06F0 - U+06F9)

**التطبيق:**
- استخدم `formatNumber(value, locale)` من `@/core/i18n/format-number` دائماً
- لا تستخدم `.toLocaleString('ar')` مباشرة (قد تنتج أرقاماً هندية)
- عند الإدخال، حوّل بـ `convertToArabicDigits()` تلقائياً
- ESLint سيرفض كتابة `٠-٩` أو `۰-۹` في الكود

```typescript
// ❌ خطأ
<span>{amount}</span>
<span>{amount.toLocaleString('ar')}</span>

// ✅ صح
const f = useFormat();
<span>{f.currency(amount)}</span>
```

### 2. التدويل (i18n) — لا نصوص حرفية في JSX

**القاعدة:** كل نص ظاهر للمستخدم يأتي من `messages/{locale}.json`.

```tsx
// ❌ خطأ
<button>حفظ</button>
<h1>إدارة الفواتير</h1>

// ✅ صح
const t = useTranslations('common');
<button>{t('save')}</button>
```

ESLint سيرفض النصوص العربية الحرفية في JSX.

### 3. RTL — استخدم Logical Properties فقط

```tsx
// ❌ خطأ
<div className="ml-4 pr-2 text-left">

// ✅ صح
<div className="ms-4 pe-2 text-start">
```

### 4. الأمن — قواعد لا تتفاوض عليها

- **لا secrets في الكود أبداً** — استخدم `.env.local` (في `.gitignore`)
- **لا localStorage للـ tokens** — httpOnly cookies فقط للويب
- **كل API route يبدأ بـ** `authenticate(req)` و `authorize(membership)`
- **كل input يمر عبر Zod schema** — لا exception
- **ملفات مرفوعة:** MIME whitelist + magic byte check + ClamAV + EXIF stripping
- **صور الأطفال:** EXIF stripping إجباري (موقع جغرافي)

### 5. Multi-Tenancy — كل query يفلتر بـ `householdId`

```typescript
// ❌ خطأ
const bills = await prisma.bill.findMany();

// ✅ صح
const bills = await prisma.bill.findMany({
  where: { householdId: session.householdId }
});
```

**أو الأفضل:** استخدم `withHousehold()` helper.

### 6. الأرقام العشرية — Decimal، ليس Float

```prisma
// ❌ خطأ
amount Float

// ✅ صح
amount Decimal @db.Decimal(10, 2)
```

أي مبلغ مالي = `Decimal`. لا `Float` ولا `Number` لأن المال لا يحتمل أخطاء التقريب.

### 7. التصميم المتجاوب — Mobile-First إجباري

كل صفحة وكل component **يجب** أن يعمل على:
- 📱 جوال (375px فأكبر)
- 📱 تابلت portrait (768px)
- 📱 تابلت landscape / iPad (1024px)
- 💻 desktop (1280px فأكبر)

**القواعد:**
- ابدأ بـ Mobile-first دائماً (`flex-col md:flex-row` وليس العكس)
- استخدم Tailwind breakpoints الستاندرد فقط (`sm`, `md`, `lg`, `xl`, `2xl`)
- لا breakpoints مخصصة (`min-[900px]` ممنوع)
- Touch targets ≥ 44px على كل العناصر التفاعلية (60px للأطفال)
- اختبر على 5 أبعاد على الأقل قبل أي PR
- لا horizontal scroll أبداً على أي حجم شاشة
- Sidebar للديسكتوب، Bottom Nav للجوال

**التفاصيل الكاملة في قسم "التصميم المتجاوب" أدناه.**

---

## 🏗️ بنية المشروع

```
src/
├── app/                              # Next.js routes
│   └── [locale]/                     # كل الصفحات تحت locale segment
│       ├── (web)/                    # صفحات Server Components
│       └── api/v1/                   # REST API endpoints
├── features/                         # كل وحدة مستقلة
│   ├── bills/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/                      # repository + business logic
│   │   ├── lib/                      # pure functions (testable)
│   │   ├── schemas/                  # Zod schemas
│   │   └── types.ts
│   ├── chores/
│   ├── shopping/
│   ├── appliances/
│   ├── warranty/                     # وحدة الضمانات والفواتير
│   ├── archive/                      # الأرشيف العام
│   ├── house-economy/                # اقتصاد البيت للأطفال
│   └── notifications/
├── shared/                           # مكونات مشتركة
│   ├── ui/                           # shadcn components
│   ├── hooks/                        # useFormat, useAuth
│   └── lib/
├── core/                             # البنية التحتية
│   ├── auth/
│   ├── db/                           # prisma client
│   ├── storage/                      # supabase storage wrapper
│   ├── i18n/                         # next-intl + format-number
│   ├── notifications/                # telegram + push
│   ├── native/                       # Capacitor abstractions
│   └── config/                       # feature flags
└── server/
    ├── jobs/                         # cron tasks
    └── workers/                      # BullMQ workers
```

**القاعدة:** ميزة جديدة = مجلد جديد في `features/`، ليس تعديل ملفات مبعثرة.

---

## 🛠️ Stack تقني

| الطبقة | التقنية | السبب |
|--------|--------|------|
| Framework | Next.js 15 (App Router) | RSC + ISR + REST API |
| Language | TypeScript (strict) | type safety إجباري |
| Styling | Tailwind CSS + shadcn/ui | RTL-friendly + utility-first |
| ORM | Prisma | type-safe + migrations |
| DB | PostgreSQL 16 | reliable + JSON support + RLS |
| Auth | Supabase Auth | Phone OTP جاهز |
| Storage | Supabase Storage | signed URLs + bucket isolation |
| i18n | next-intl | App Router-friendly |
| State | TanStack Query | caching + optimistic updates |
| Forms | react-hook-form + Zod | validation موحّد |
| Testing | Vitest + Playwright | unit + e2e |
| Cron | BullMQ + Redis | reliable + retries |
| Bot | Python aiogram | اللغة الأنسب للـ Telegram bots |
| Deploy | Docker + Caddy على Pi 4 (الآن) | يتوسّع لـ Hetzner لاحقاً |

---

## 📋 معايير الكود

### TypeScript
- `"strict": true` في tsconfig
- `any` ممنوع (إلا مع `// eslint-disable-next-line` + سبب)
- استخدم `interface` للـ public APIs و `type` للـ internal

### Naming Conventions
- **Files:** `kebab-case.ts` (مثال: `period-engine.ts`)
- **Components:** `PascalCase.tsx` (مثال: `BillCard.tsx`)
- **Functions:** `camelCase` (مثال: `calculateNextDueDate`)
- **Constants:** `UPPER_SNAKE_CASE` (مثال: `MAX_FILE_SIZE_MB`)
- **Enums (Prisma):** `UPPER_SNAKE_CASE` (مثال: `WHO_LEAST_DID_IT_FIRST`)
- **DB columns:** `snake_case` (Prisma يحوّلها تلقائياً)

### Imports
```typescript
// 1. External libraries
import { useState } from 'react';
import { z } from 'zod';

// 2. Core
import { prisma } from '@/core/db';
import { formatNumber } from '@/core/i18n/format-number';

// 3. Shared
import { Button } from '@/shared/ui/button';

// 4. Feature (نفس الـ feature)
import { calculateNextDueDate } from '../lib/period-engine';

// 5. Types
import type { Bill } from './types';
```

### Comments
- **بالعربية** للوصف العام (للتوضيح للفريق)
- **بالإنجليزية** للأسباب التقنية والـ TODOs
- **JSDoc** لأي function exported

```typescript
/**
 * يحسب الموعد القادم لمهمة دورية حسب نوع التكرار.
 * Calculates next due date based on chore period type.
 * Reference: Grocy's calculateNextDueDate algorithm.
 */
export function calculateNextDueDate(...) {}
```

---

## 🧪 Testing

### Pyramid
- **80%:** Unit tests على pure functions في `features/*/lib/`
- **15%:** Integration tests على API routes + repositories
- **5%:** E2E tests على flows أساسية (login → create bill → mark paid)

### Coverage gates
- `features/*/lib/` يجب ≥ 70%
- `core/*` يجب ≥ 80%
- E2E مهم: على الأقل smoke test لكل ميزة

### نموذج
```typescript
// features/chores/lib/__tests__/period-engine.test.ts
describe('calculateNextDueDate', () => {
  it('handles DYNAMIC_REGULAR correctly', () => {
    const chore = { periodType: 'DYNAMIC_REGULAR', periodDays: 10 };
    const last = new Date('2026-01-01');
    expect(calculateNextDueDate(chore, last)).toEqual(new Date('2026-01-11'));
  });
});
```

---

## 🚦 Git Workflow

### Branches
- `main` — production-ready (محمي، يحتاج PR)
- `dev` — integration branch
- `feature/short-description` — للميزات الجديدة
- `fix/issue-description` — للإصلاحات
- `chore/...` — للـ refactoring والصيانة

### Commit Messages (Conventional Commits)
```
feat(bills): add recurring bill generation
fix(chores): correct period calculation for monthly type
chore(deps): update next.js to 15.1
docs(readme): add deployment instructions
test(period-engine): add edge case tests
refactor(auth): extract JWT verification to helper
```

### Pre-commit (Husky)
- ESLint must pass
- Prettier formatting
- TypeScript: `tsc --noEmit`
- لا أرقام هندية في الكود
- لا نصوص عربية حرفية في JSX

---

## 📦 إدارة الحزم

### عند إضافة dependency جديدة
1. **هل ضرورية؟** — كل dependency = security risk + bundle size
2. **هل مكتبة موجودة تكفي؟** — لا تضيف 2 لنفس الغرض
3. **حجمها:** `npm install --check-cost` أو bundlephobia
4. **maintenance:** آخر تحديث، open issues، GitHub stars
5. **license:** MIT/Apache/ISC فقط — تجنّب AGPL والـ copyleft

### مكتبات ممنوعة في المشروع
- `moment.js` (ضخم، deprecated) → استخدم `date-fns`
- `lodash` (ضخم، استخدم `lodash-es` أو الدوال الأصلية)
- `axios` → استخدم `fetch` (موجود native)
- `jquery` (لا حاجة في React)

---

## 🌐 i18n — استخدام next-intl

### إضافة نص جديد
1. **أضف المفتاح في** `src/i18n/messages/ar.json`
2. **أضف نفس المفتاح في** `src/i18n/messages/en.json` (placeholder حالياً)
3. **استخدم في الكود:**
   ```tsx
   const t = useTranslations('bills');
   <h1>{t('title')}</h1>
   ```

### مفاتيح الترجمة — التنظيم
```json
{
  "common": { "save", "cancel", "delete" },
  "navigation": { "dashboard", "bills" },
  "bills": { "title", "add", "providers": { ... } },
  "errors": { "required", "networkError" }
}
```

**القاعدة:** ابدأ بفئة (namespace)، ثم المفتاح. لا تكدّس كل شيء في root.

---

## 🔢 الأرقام والتواريخ — استخدام موحّد

```typescript
// ✅ دائماً عبر useFormat
const f = useFormat();
f.number(1234)           // "1,234"
f.currency(150.5)        // "150.50 ر.س"
f.date(new Date())       // "26 أبريل 2026"
f.hijri(new Date())      // "9 شوال 1447"
f.phone('0501234567')    // "050 123 4567"
```

**القاعدة:** لا تستخدم `.toLocaleString()` مباشرة أبداً. كل تنسيق يمر عبر `useFormat` للضمان.

---

## 📱 التصميم المتجاوب (Responsive Design) — إجباري لكل صفحة

### الفلسفة: Mobile-First دائماً

ابدأ كل component بتصميم الجوال (320px)، ثم وسّع للأكبر. **لا العكس أبداً**.

```tsx
// ✅ صح — Mobile-first
<div className="flex flex-col md:flex-row gap-4">

// ❌ خطأ — Desktop-first
<div className="flex flex-row sm:flex-col gap-4">
```

### Breakpoints المعتمدة (Tailwind CSS Standard)

| Breakpoint | العرض | الجهاز المستهدف |
|-----------|------|----------------|
| **default** | < 640px | جوال (iPhone SE → iPhone Pro Max) |
| **sm:** | ≥ 640px | جوال أفقي + تابلت صغير portrait |
| **md:** | ≥ 768px | iPad portrait + tablets |
| **lg:** | ≥ 1024px | iPad landscape + laptop صغير |
| **xl:** | ≥ 1280px | desktop عادي |
| **2xl:** | ≥ 1536px | desktop كبير + 4K |

**القاعدة:** لا تستخدم breakpoints مخصصة. التزم بستاندرد Tailwind حصراً.

### الأجهزة المرجعية للاختبار

كل صفحة يجب اختبارها فعلياً على هذه الأبعاد:

| الجهاز | البعد | الفئة |
|-------|------|------|
| iPhone SE | 375 × 667 | جوال صغير |
| iPhone 14 Pro | 393 × 852 | جوال متوسط |
| iPhone 14 Pro Max | 430 × 932 | جوال كبير |
| Samsung Galaxy S23 | 360 × 780 | جوال Android |
| iPad mini portrait | 768 × 1024 | تابلت صغير |
| iPad portrait | 820 × 1180 | تابلت |
| iPad Pro landscape | 1366 × 1024 | تابلت كبير |
| MacBook Air | 1280 × 832 | laptop |
| Desktop FHD | 1920 × 1080 | desktop |
| Desktop 2K | 2560 × 1440 | desktop كبير |

**في DevTools:** اختبر دائماً على Chrome DevTools Device Toolbar (Cmd/Ctrl+Shift+M) قبل الـ commit.

### التخطيط لكل فئة (Layout Strategy)

#### 📱 جوال (< 768px)
- **عمود واحد** فقط لكل المحتوى
- **Bottom Navigation** ثابت (5 أيقونات كحد أقصى)
- **Header** مرتفع (مع زر القائمة + اللوغو + إشعارات)
- **Modal/Sheet** يأخذ كامل الشاشة
- **Forms** عمودية، حقل تحت حقل
- **Cards** عرضها 100% بـ padding 16px
- **Touch targets ≥ 44px** (إجباري — Apple HIG)
- **Font size base:** 16px (لا تنزل تحت 14px للنصوص)

#### 📱 تابلت Portrait (768px – 1023px)
- **عمودان** للـ cards والقوائم
- **Sidebar مخفي افتراضياً** (يفتح بزر)
- أو **Bottom Navigation** كما الجوال (أحياناً أفضل)
- **Modal** بعرض 80% من الشاشة (مع تظليل خلفي)
- **Forms** قد تكون عمودان
- **Touch targets ≥ 44px**

#### 📱 تابلت Landscape (1024px – 1279px) / Laptop صغير
- **Sidebar ظاهر** (بعرض 240px)
- **محتوى رئيسي** + sidebar أيمن (ل widgets) — اختياري
- **3 أعمدة** للـ cards
- **Forms** عمودين بشكل افتراضي
- **Touch + Mouse** mixed — ضع cursors واضحة

#### 💻 Desktop (≥ 1280px)
- **Sidebar كامل** (260-280px)
- **محتوى مع max-width** (1200-1400px) لقابلية القراءة
- **4 أعمدة** للـ cards
- **Hover states** كاملة (cursors، tooltips، transitions)
- **Keyboard shortcuts** (مثل Cmd+K للبحث)
- **يستخدم العرض الكامل** بحكمة (لا تترك فراغ كبير)

### قواعد ملموسة (Concrete Rules)

#### 1. Container Standard
```tsx
// كل صفحة محتواها في container متجاوب
<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  {children}
</div>
```

#### 2. Grid Responsive
```tsx
// مثال: قائمة فواتير
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {bills.map(...)}
</div>
```

#### 3. Typography Scale
```tsx
// العناوين تكبر مع الشاشة
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
<h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">
<p className="text-base md:text-lg">  {/* نصوص عادية */}
```

#### 4. Spacing Scale
```tsx
// Padding يكبر مع الشاشة
<section className="p-4 md:p-6 lg:p-8">

// Gap بين العناصر
<div className="space-y-3 md:space-y-4 lg:space-y-6">
```

#### 5. Navigation Switch
```tsx
// Sidebar للديسكتوب فقط، Bottom nav للجوال والتابلت portrait
<aside className="hidden lg:block lg:w-64">  {/* Sidebar */}

<nav className="lg:hidden fixed bottom-0 ...">  {/* Bottom nav */}
```

#### 6. Image Responsiveness
```tsx
// دائماً next/image مع sizes
<Image
  src={bill.image}
  alt=""
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="object-cover"
/>
```

#### 7. Modal/Dialog
```tsx
// Sheet (full-screen) على الجوال، Dialog عادي على الديسكتوب
<Sheet>  {/* shadcn Sheet — تختار وضعها */}
  <SheetContent side="bottom" className="md:max-w-md md:rounded-lg">
```

#### 8. Forms
```tsx
// عمود واحد على الجوال، عمودان على md+
<form className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input name="title" className="md:col-span-2" />  {/* full width */}
  <Input name="amount" />
  <Input name="dueDate" />
</form>
```

#### 9. Touch Targets (إجباري)
```tsx
// كل عنصر تفاعلي ≥ 44×44px
<button className="min-h-[44px] min-w-[44px] ...">
<a className="py-3 px-4 ...">  {/* padding يضمن المساحة */}
```

#### 10. Safe Area (للـ iPhone notch)
```tsx
// في layout الرئيسي
<body className="pt-[env(safe-area-inset-top)]
                 pb-[env(safe-area-inset-bottom)]">
```

### الواجهة للأطفال (٤-٨ سنوات) — معايير مختلفة

في وحدة "اقتصاد البيت" للأطفال الصغار:
- **Touch targets ≥ 60px** (وليس 44px)
- **Font size ≥ 18px** للنصوص الأساسية
- **Buttons كبيرة جداً** مع emoji + نص
- **ألوان زاهية** (مشبعة)
- **لا hover states** (الأطفال على touch دائماً)

### اختبار إجباري قبل أي PR

1. **Chrome DevTools Device Toolbar** — جرّب 5 أبعاد على الأقل:
   - 375 (iPhone SE)
   - 768 (iPad portrait)
   - 1024 (iPad landscape)
   - 1280 (laptop)
   - 1920 (desktop)

2. **اختبار جوّال حقيقي** — لا تكتفي بـ DevTools للصفحات الجوهرية

3. **Lighthouse Mobile** — يجب أن يكون ≥ 90 على جوال (وليس desktop فقط)

4. **No horizontal scroll** — أبداً، على أي حجم. اختبر بـ:
   ```css
   /* في DevTools console */
   document.body.scrollWidth > window.innerWidth // يجب false
   ```

### Anti-Patterns (ممنوعة)

```tsx
// ❌ عرض ثابت
<div className="w-[500px]">

// ❌ ارتفاع ثابت يقص المحتوى
<div className="h-[400px] overflow-hidden">

// ❌ font-size بـ px ثابت
<p className="text-[18px]">  /* استخدم text-lg أو rem */

// ❌ media query مخصص
<div className="min-[900px]:flex">  /* استخدم md: */

// ❌ hide بالكامل على الجوال
<div className="hidden md:block">  /* الجوال يجب أن يحصل على البديل */
```

### Tailwind Safelist (إذا احتجنا)

في `tailwind.config.ts`، تأكد من:
```typescript
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
],
theme: {
  extend: {
    screens: {
      // التزم بالستاندرد — لا تضف breakpoints مخصصة
    }
  }
}
```

### Shadcn/ui — الإعدادات المطلوبة

عند تثبيت shadcn:
```bash
npx shadcn@latest init
# عند السؤال:
# - Style: Default
# - Base color: Slate (أو حسب الـ theme)
# - CSS variables: Yes
# - RTL: تأكد من إعداد direction
```

كل component shadcn responsive افتراضياً، لكن تحقق من:
- Dialog → Sheet على الجوال (shadcn يدعمها)
- DataTable → Cards على الجوال (تحويل يدوي)
- Sidebar → Bottom nav على الجوال (تحويل يدوي)

---

## 🚀 الأداء — حدود صارمة

### في CI
- **Bundle size initial:** ≤ 200KB (gzipped)
- **Lighthouse Performance (Mobile):** ≥ 90
- **Lighthouse Performance (Desktop):** ≥ 95
- **Lighthouse Accessibility:** ≥ 95
- **First Contentful Paint:** ≤ 1.5s
- **Largest Contentful Paint:** ≤ 2.5s
- **Cumulative Layout Shift:** ≤ 0.1
- **Total Blocking Time:** ≤ 200ms

### Best Practices
- ✅ Server Components افتراضياً (Client فقط للتفاعل)
- ✅ `next/image` لكل صورة مع `sizes` صحيح
- ✅ `dynamic()` للـ components الثقيلة
- ✅ `staleTime` و `gcTime` مناسبة في React Query
- ❌ لا `useEffect` للـ data fetching (استخدم Server Components أو Query)
- ❌ لا `JSON.parse(JSON.stringify())` للـ deep clone (استخدم `structuredClone`)

---

## 🤝 عند الشك — اسأل

إذا كنت (Claude) غير متأكد من قرار، **اسأل قبل التنفيذ**. أمثلة:
- إضافة dependency جديدة كبيرة
- تغيير schema في Prisma
- إضافة API endpoint جديد
- تغيير سلوك المصادقة
- ميزة لم تُذكر في `EXECUTION_PLAN_V2.md`

**القاعدة:** الشك → سؤال. الثقة → تنفيذ.

---

## 📝 عند تحديث هذا الملف

أي تغيير معماري كبير = تحديث هذا الملف **فوراً**. أمثلة:
- تغيير stack (مكتبة أساسية)
- إضافة قاعدة جديدة
- تغيير بنية المجلدات
- تغيير conventions

**سجّل التغيير في `DEV_LOG.md` أيضاً** مع التاريخ والسبب.

---

## 🎓 المصادر المرجعية

- [Next.js 15 docs](https://nextjs.org/docs)
- [Prisma docs](https://www.prisma.io/docs)
- [next-intl docs](https://next-intl-docs.vercel.app/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind RTL](https://tailwindcss.com/docs/configuration#rtl-support)
- [Grocy source](https://github.com/grocy/grocy) — مرجع لمنطق المهام الدورية
- [HomeBox source](https://github.com/sysadminsmedia/homebox) — مرجع لإدارة الممتلكات

---

**آخر تحديث:** 2026-04-27
**النسخة:** 1.0
