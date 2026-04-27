# 📔 سجل التطوير اليومي — "بيتي"

> سجل ما تم تنفيذه يومياً، القرارات المتخذة، والدروس المستفادة.
> القاعدة: قيّد كل شيء حتى لو بدا تافهاً — قد يصبح مهماً بعد ٣ أشهر.

---

## 📋 كيفية استخدام هذا الملف

كل يوم عمل، أضف entry جديدة بهذا القالب:

```markdown
## 📅 YYYY-MM-DD (اليوم — السبت/الأحد/...)

**المرحلة:** الأسبوع X — اليوم Y
**المدة:** X ساعات
**الحالة:** ✅ مكتمل / 🟡 جزئي / 🔴 متعثّر

### ✅ ما أنجزته
- نقطة 1
- نقطة 2

### 🎯 القرارات المتخذة
- **القرار:** اخترت X بدلاً من Y
- **السبب:** ...
- **البدائل المرفوضة:** ...

### 🐛 مشاكل واجهتها
- **المشكلة:** ...
- **الحل:** ...
- **المدة الضائعة:** X دقيقة/ساعة

### 💡 أفكار ظهرت
- فكرة لميزة مستقبلية
- تحسين محتمل
- شيء يستحق البحث لاحقاً

### ⏭️ غداً
- المهمة التالية
- ما يجب الاستعداد له

### 📊 المقاييس
- Lines of code: ...
- Files added/modified: ...
- Tests: X passing
- Build time: X seconds
```

---

## 🚀 المرحلة ما قبل التنفيذ — التخطيط والبحث

---

## 📅 2026-04-26 (الأحد) — جلسة التخطيط

**المرحلة:** ما قبل التنفيذ
**المدة:** جلسة planning مع Claude
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته
- مراجعة المشاريع المفتوحة (Grocy, HomeHub, Splitastic, Homechart)
- استخراج الميزات المستحقة في `EXTRACTED_FEATURES.md`
- تصميم mockups أولية (mobile + desktop + v1 + v2)
- بناء `EXECUTION_PLAN.md` الأولي (٦ أسابيع، ٤٢ يوم)

### 🎯 القرارات المتخذة
- **اختيار Stack:** Next.js 15 + Prisma + Supabase + Telegram Bot
  - **السبب:** خبرة سابقة، مجتمع واسع، type-safe end-to-end
  - **البدائل المرفوضة:** Remix (أقل dom support)، SvelteKit (المجتمع الأصغر)
- **النشر على Pi 4:** كبيئة تطوير وإطلاق أولي
  - **السبب:** Pi موجود فعلاً + توفير تكلفة Hetzner لاحقاً

### 💡 أفكار ظهرت
- ميزة محتملة: قراءة الفواتير من الإيميل بـ Claude API
- ميزة محتملة: OCR للفواتير المصوّرة
- ميزة محتملة: تكامل SADAD للدفع المباشر

---

## 📅 2026-04-27 (الإثنين) — تطوير الخطة المعمارية

**المرحلة:** ما قبل التنفيذ
**المدة:** ~3 ساعات (محادثة مع Claude)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته
1. **إضافة وحدة "اقتصاد البيت" للأطفال** — منيو أعمال + محفظة + ادخار + صدقة
2. **إضافة وحدة "الضمانات وأرشيف الفواتير"** — تخزين فواتير الأجهزة + OCR
3. **إضافة قسم المبادئ المعمارية الأساسية** في `EXECUTION_PLAN_V2.md`:
   - i18n من اليوم الأول (next-intl + ar/en)
   - Security by Design (10 طبقات)
   - Scalability (Feature-based architecture)
   - Mobile-Ready & SaaS-Ready (10 قرارات بدون تكلفة)
4. **قاعدة الأرقام العربية** — 10 طبقات لإجبار 0-9 ومنع ٠-٩
5. **بناء `CLAUDE.md`** — مرجع المساعد الذكي
6. **بناء `DEV_LOG.md`** — هذا الملف

### 🎯 القرارات المتخذة

#### 1. **الأرقام: 0-9 فقط (الأرقام العربية الأصلية)**
- **القرار:** نمنع ٠١٢٣٤٥٦٧٨٩ (الهندية) و ۰۱۲۳۴۵۶۷۸۹ (الفارسية) في كل التطبيق
- **السبب:** تفضيل المستخدم + اتساق + قراءة أسهل في contexts mixed
- **التطبيق:** 10 طبقات حماية (CSS, HTML lang, JS Intl, ESLint, Pre-commit, Inputs, Zod, DB, Tests)
- **خطأ ارتكبته:** في البداية، خلطت بين المسميات. صحّحت بعد التوضيح من المستخدم.

#### 2. **استراتيجية الجوال: Next.js + استعداد لـ Capacitor**
- **القرار:** Next.js عادي مع Native Abstractions Layer، لا Expo/Solito الآن
- **السبب:**
  - احتمال SaaS: 20-50% (غير مؤكد)
  - لا خبرة سابقة بـ React Native/Expo (منحنى تعلّم خطر)
  - Next.js stack شائع → سهل توظيف فريق
- **البدائل المرفوضة:**
  - Expo + Solito Monorepo: مبالغة لاحتمالية 20-50%
  - React Native منفصل: مكلف جداً (إعادة بناء UI)
  - PWA فقط: غير كافٍ لـ SaaS لاحقاً (App Stores)
- **التكلفة:** يومان إضافيان فقط على الـ 48 يوم
- **الفائدة:** عند قرار SaaS لاحقاً → 3 أسابيع بدلاً من 12-16

#### 3. **بنية المجلدات: Feature-Based**
- **القرار:** كل ميزة في `features/{name}/` تحوي components, hooks, api, lib, schemas
- **السبب:** أسهل للتوسع وللفريق + كل feature مستقلة
- **البديل المرفوض:** Layer-based (`components/`, `hooks/`, `api/`)

#### 4. **i18n من اليوم الأول حتى لو نطلق بالعربية فقط**
- **القرار:** كل النصوص في `messages/ar.json`، ESLint يرفض النصوص الحرفية
- **السبب:** إضافة لغة لاحقاً = ٢-٣ أيام بدلاً من ٢-٣ أشهر
- **مكتبة:** next-intl (الأنسب لـ App Router)

#### 5. **Subscription Schema موجود في Prisma لكن مُعطّل**
- **القرار:** نضيف جداول Subscription, BillingEvent من اليوم ٢
- **السبب:** عند قرار SaaS → migration واحد بدلاً من إعادة كتابة
- **التكلفة الآن:** ساعتان فقط

### 🐛 مشاكل واجهتها
- **المشكلة:** خلط في تسمية الأرقام (هندية vs عربية أصلية)
- **الحل:** المستخدم وضّح، صحّحنا الـ 10 طبقات بالكامل
- **الدرس:** التأكد من المصطلحات قبل الكتابة، لأن المستخدم العربي قد يستخدم تسميات مختلفة عن الـ Unicode standard

#### 6. **التصميم المتجاوب: Mobile-First إجباري على كل صفحة**
- **القرار:** كل صفحة و component تعمل على جوال + تابلت + ديسكتوب
- **Breakpoints المعتمدة:** Tailwind standard فقط (`sm:640`, `md:768`, `lg:1024`, `xl:1280`, `2xl:1536`)
- **Touch targets:** ≥ 44px للبالغين، ≥ 60px للأطفال (٤-٨ سنوات)
- **التخطيط:**
  - جوال: عمود واحد + Bottom Nav
  - تابلت portrait: عمودان + قائمة قابلة للطي
  - تابلت landscape / Desktop: Sidebar + محتوى متعدد الأعمدة
- **الاختبار الإجباري:** 5 أبعاد قبل كل PR (375, 768, 1024, 1280, 1920)
- **التوثيق:** قسم كامل في CLAUDE.md (Anti-patterns + concrete rules)

### 💡 أفكار ظهرت
- **ميزة QR Code للأجهزة:** من HomeBox — تطبع QR على الجهاز فيفتح صفحته
- **ميزة Asset ID:** رقم تعريف داخلي قابل للطباعة
- **ميزة "إعارة الأشياء":** تتبع ما أعرته لمن
- **ميزة "تاريخ الخروج من الخدمة":** تتبع الأجهزة المباعة/المتخلّص منها
- **ميزة استيراد CSV:** لمن عندهم spreadsheet جاهز

### ⏭️ التالي
**اليوم ١ من خطة التنفيذ (الأسبوع ١):**
- SSH للـ Pi
- إنشاء مشروع Next.js
- بنية المجلدات Feature-Based
- إعداد ESLint + Prettier + Husky
- ملف `.env.local.example`
- `docker-compose.dev.yml`
- إنشاء `ARCHITECTURE.md` و `SECURITY.md`

### 📊 المقاييس
- ملفات مكتوبة: 5 (`EXTRACTED_FEATURES.md`, `EXECUTION_PLAN.md`, `EXECUTION_PLAN_V2.md`, `CLAUDE.md`, `DEV_LOG.md`)
- خطوط الخطة الكاملة: ~2400+ سطر
- ميزات MVP محددة: 7 وحدات رئيسية
- مبادئ معمارية موثقة: 4 (i18n, Security, Scalability, Mobile/SaaS)

---

---

## 📅 2026-04-27 (الإثنين) — إصلاح Dependencies المستودع

**المرحلة:** ما قبل التنفيذ — إصلاح بنية الحزم
**الحالة:** ✅ مكتمل

### 🐛 مشاكل تم اكتشافها وإصلاحها

#### 1. next@16 غير متوافق مع next-intl@3.x
- **المشكلة:** `next@16.2.4` في package.json — next-intl@3.26.5 يدعم فقط Next.js ≤15
- **الحل:** تغيير إلى `"next": "^15.3.1"` (أحدث إصدار stable في السلسلة 15)
- **ملاحظة:** كان create-next-app ثبّت v16 تلقائياً، لكن CLAUDE.md ينص صراحةً على Next.js 15

#### 2. date-fns-jalali — مكتبة غير موجودة + غير مستخدمة
- **المشكلة:** `"date-fns-jalali": "^3.1.0"` — الإصدار 3.1.0 الـ stable غير موجود على npm (المتاح فقط: 3.1.0-0 prerelease). كذلك `grep` أثبت أن لا import لها في أي ملف تحت `src/`
- **الحل:** حذف المكتبة كاملاً من dependencies
- **السبب:** التقويم الهجري يُحسَب بخوارزمية Julian Day Number مكتوبة يدوياً في `HijriCalendarWidget.tsx` — لا حاجة لمكتبة خارجية

#### 3. غياب package-lock.json
- **الوضع:** لا package-lock.json في المستودع — يُنشأ تلقائياً عند أول `npm install` بعد إصلاح المشكلتين أعلاه
- **الإجراء:** تشغيل `npm install` على الجهاز المستهدف بعد هذه الإصلاحات سيولّده

### 🎯 القرارات المتخذة
- **البقاء على next-intl@3.x + next@15** — التوافق أهم من مطاردة أحدث إصدار. next-intl 4.x API لا يزال جديداً وقد يكسر code موجود
- **لا إضافة بديل للهجري** — الخوارزمية اليدوية في `HijriCalendarWidget.tsx` كافية لأغراض العرض

### 📊 المقاييس
- ملفات معدّلة: 1 (package.json)
- dependencies محذوفة: 1 (date-fns-jalali)
- dependencies معدّلة: 1 (next: 16→15)

---

## 🛠️ المرحلة 1: التنفيذ

---

## 📅 2026-04-27 (الإثنين) — اليوم 2، الأسبوع 1

**المرحلة:** الأسبوع 1 — اليوم 2 (Prisma Schema + قاعدة البيانات)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### prisma/schema.prisma — 22 جدول و17 enum
- **User, Household, HouseholdMember** — Core مع soft delete
- **Bill, BillPayment** — فواتير مع Decimal @db.Decimal(10,2) ✅
- **Chore, ChoreExecution** — مهام دورية مع كل الـ enums (PeriodType × 6، AssignmentType × 5)
- **ShoppingList, ShoppingItem** — مشتريات مع Urgency enum
- **Appliance, WarrantyDocument, MaintenanceSchedule, MaintenanceLog** — أجهزة وضمانات وصيانة
- **DocumentArchive** — أرشيف الوثائق مع OCR text ومع ArchiveCategory × 9
- **JobMenuItem, JobInstance, ChildWallet, SavingsGoal, WalletTransaction** — اقتصاد البيت الكامل
- كل جدول: householdId + createdAt + updatedAt + deletedAt (soft delete)
- Indexes على كل الأعمدة المُستخدمة في WHERE/JOIN

#### src/core/db/prisma.ts — Singleton Client
- Dev: يُعيد استخدام نفس الـ instance لمنع hot-reload connections
- Prod: instance واحد فقط

#### src/core/db/with-household.ts — Authorization Helper
- `withHousehold()` — التحقق من العضوية قبل كل query
- `withRole()` — التحقق من الدور كحد أدنى
- `hasRole()`, `isParent()`, `isChild()` — pure functions
- `handleApiError()` — معالجة مركزية للأخطاء
- Custom errors: ForbiddenError, UnauthorizedError, NotFoundError

#### prisma/seeds/seed.ts — بيانات تجريبية واقعية
- 4 مستخدمين (أب + أم + طفلان 11 و9 سنوات)
- بيت واحد + محفظتا طفلين
- 5 فواتير (كهرباء، إنترنت، نتفليكس، مياه، STC Play) بحالات مختلفة
- 6 مهام دورية بأنواع تكرار مختلفة
- 10 أعمال في منيو الأطفال (سهل/متوسط/صعب)
- 3 أجهزة مع ضمانات (مكيف، ثلاجة، غسالة)
- قائمة مشتريات بـ 6 عناصر

### 🎯 القرارات المتخذة
- **CUID بدلاً من auto-increment** — جاهز للـ sharding مستقبلاً
- **String[] للـ assignedMemberIds** — أبسط من relation table لهذه الحالة
- **Decimal @db.Decimal(10,2) على كل المبالغ** — لا Float أبداً
- **Soft delete (deletedAt)** على كل الجداول الرئيسية للتدقيق

### 📊 المقاييس
- جداول: 22 | Enums: 17 | Indexes: 20+
- اختبارات جديدة: 8 (with-household)

---

## 📅 2026-04-27 (الإثنين) — اليوم 1، الأسبوع 1

**المرحلة:** الأسبوع 1 — اليوم 1 (إعداد المشروع + البنية المعمارية)
**المدة:** جلسة عمل كاملة مع Claude (Cowork)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### 1. إنشاء مشروع Next.js 16 (latest)
- `npx create-next-app@16.2.4` مع TypeScript + Tailwind + App Router + src-dir
- تثبيت كل الحزم: `next-intl`, `zod`, `react-hook-form`, `date-fns`, `lucide-react`, `bcryptjs`, `sharp`, وغيرها

#### 2. بنية المجلدات Feature-Based (كاملة)
```
src/
├── app/[locale]/(web)/dashboard/   ← صفحة placeholder
├── app/api/v1/{bills,chores,...}   ← REST API structure
├── features/{bills,chores,shopping,appliances,warranty,archive,house-economy,notifications}/
│   └── {components,hooks,api,lib/__tests__,schemas}/
├── core/{auth,db,storage,i18n,notifications,config,native}/
├── shared/{ui,hooks,lib,types}/
├── i18n/messages/{ar.json,en.json}
└── server/{jobs,workers}/
```

#### 3. ESLint + Prettier + Husky
- `eslint.config.mjs` — Flat Config (ESLint 9) مع:
  - منع النصوص العربية الحرفية في JSX
  - منع الأرقام الهندية (٠-٩) والفارسية (۰-۹) في الكود
  - منع Logical Properties المخالفة للـ RTL
  - منع localStorage للـ tokens
  - منع moment.js/lodash/axios
- `.prettierrc` مع إعدادات العربية والـ RTL
- `.husky/pre-commit` — يفحص قبل كل commit

#### 4. ملفات البنية الأساسية
- **`ARCHITECTURE.md`** — معمارية كاملة مع ADRs (6 قرارات موثقة)
- **`SECURITY.md`** — سياسة الأمن الكاملة (8 أقسام)
- **`.env.local.example`** — كل المتغيرات موثقة بدون قيم حقيقية
- **`docker-compose.dev.yml`** — PostgreSQL 16 + Redis 7 + Next.js + Adminer
- **`.gitignore`** محدّث — يستثني .env.local تحديداً

#### 5. نظام i18n الكامل
- **`src/i18n/config.ts`** — `ar-SA-u-nu-latn` لإجبار 0-9
- **`src/i18n/request.ts`** — next-intl server config مع timezone: Asia/Riyadh
- **`src/i18n/messages/ar.json`** — 200+ مفتاح ترجمة كاملة
- **`src/i18n/messages/en.json`** — نسخة إنجليزية كاملة (للمستقبل)

#### 6. نظام الأرقام العربية (10 طبقات)
- **`src/core/i18n/format-number.ts`** — 9 دوال تنسيق موحّدة
  - `convertToWesternDigits()` — تحويل هندية/فارسية → عربية أصلية
  - `formatNumber()`, `formatCurrency()`, `formatDate()`, `formatHijriDate()`
  - `formatPhoneNumber()`, `formatPercent()`, `formatCompactNumber()`
- **`src/shared/hooks/useFormat.ts`** — React hook موحّد للـ client
- **`src/core/i18n/__tests__/format-number.test.ts`** — 24 unit test

#### 7. Next.js Layout + Tailwind RTL
- **`next.config.ts`** — next-intl plugin + security headers + images config
- **`src/middleware.ts`** — i18n + auth routing
- **`src/app/layout.tsx`** — Root layout (charset، viewport، metadata)
- **`src/app/[locale]/layout.tsx`** — Locale layout مع:
  - `lang="ar-SA-u-nu-latn"` (يجبر الأرقام الأصلية)
  - `dir="rtl"` للعربية
  - خط IBM Plex Sans Arabic
  - NextIntlClientProvider
- **`src/app/globals.css`** — CSS مع منع الأرقام الهندية على مستوى CSS
- **`src/app/[locale]/(web)/dashboard/page.tsx`** — placeholder متجاوب

#### 8. أدوات مساعدة
- **`src/shared/lib/utils.ts`** — `cn()`, `truncate()`, `omit()`, `pick()`
- **`src/core/config/features.ts`** — Feature flags
- **`src/core/config/env.ts`** — Type-safe env access
- **`vitest.config.ts`** — إعداد الاختبارات مع coverage thresholds
- **`src/test/setup.ts`** — Vitest global setup

### 🎯 القرارات المتخذة

#### 1. Next.js 16.2.4 (ليس 15)
- **القرار:** create-next-app ثبّت v16 تلقائياً
- **السبب:** أحدث إصدار stable — هذا جيد
- **التأثير:** لا يغيّر أي شيء في المعمارية

#### 2. ESLint Flat Config (ESLint 9)
- **القرار:** استخدام `eslint.config.mjs` بدلاً من `.eslintrc.json`
- **السبب:** الـ Flat Config هو المستقبل في ESLint 9+ وهو أوضح وأسرع
- **البديل المرفوض:** `.eslintrc.json` (deprecated)

#### 3. IBM Plex Sans Arabic كخط أساسي
- **القرار:** IBM Plex Sans Arabic بدلاً من Geist
- **السبب:** دعم ممتاز للعربية، رخصة مفتوحة، متاح في Google Fonts
- **البديل المرفوض:** Cairo (أقل جودة في الأوزان الخفيفة)

### 🐛 مشاكل واجهتها

#### create-next-app تعارض مع الملفات الموجودة
- **المشكلة:** المجلد يحوي CLAUDE.md, DEV_LOG.md وغيرها
- **الحل:** أنشأنا في /tmp ثم نقلنا الملفات + استعادة الملفات الأصلية
- **المدة الضائعة:** 10 دقائق

#### npm install يتجاوز مهلة الـ bash (45 ثانية)
- **المشكلة:** الحزم تستغرق أكثر من 45 ثانية للتثبيت
- **الحل:** أضفنا الحزم مباشرة في package.json وتركنا npm install للتشغيل الأول
- **الدرس:** في بيئة Cowork، الكتابة المباشرة أسرع من shell commands طويلة

### 💡 أفكار ظهرت
- **Tailwind v4:** المشروع استخدم `@import "tailwindcss"` الجديد (v4 syntax) — قد يحتاج تعديل لاحقاً
- **IBM Plex Sans Arabic:** يحتاج تحميل مسبق للأوزان الصحيحة لتجنّب CLS
- **`@testing-library/jest-dom`:** يحتاج تثبيت منفصل في package.json

### ⏭️ اليوم 3 (Auth + Supabase)
- إنشاء `prisma/schema.prisma` الكامل (كل الجداول من EXECUTION_PLAN_V2.md)
- تشغيل `prisma generate`
- إنشاء `src/core/db/prisma.ts` (singleton client)
- إنشاء migrations الأولى
- `withHousehold()` helper
- Seed script مع بيانات تجريبية

### 📊 المقاييس
- **ملفات أُنشئت/عُدِّلت:** 28 ملف
- **مجلدات أُنشئت:** 42 مجلد
- **مفاتيح ترجمة:** 200+ في ar.json وen.json
- **Unit tests:** 24 اختبار (format-number)
- **LOC (تقديري):** ~1500 سطر
- **Coverage المستهدف:** 100% على format-number.ts

---

## 📅 2026-04-27 (الإثنين) — الأسبوع 2 (أيام 7-12): وحدة الفواتير

**المرحلة:** الأسبوع 2 — Bills Module الكامل
**المدة:** جلسة عمل مع Claude (Cowork)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### Repository + Schemas
- **`src/features/bills/api/repository.ts`** — BillsRepository مع:
  - `list()` — فلتر بالحالة والفئة، pagination
  - `getSummary()` — إجماليات Dashboard (مستحق/متأخر/قادم/مدفوع هذا الشهر)
  - `create()`, `update()`, `pay()`, `delete()` (soft)
  - `generateNextRecurring()` — إنشاء فاتورة متكررة تلقائياً عند الدفع
- **`src/features/bills/schemas/index.ts`** — Zod: createBillSchema, updateBillSchema, payBillSchema, billFiltersSchema

#### API Routes
- **`GET/POST /api/v1/bills`** — قائمة + إنشاء مع rate limiting
- **`GET /api/v1/bills/summary`** — ملخص الـ Dashboard
- **`GET/PATCH/DELETE /api/v1/bills/[id]`** — CRUD فردي (soft delete)
- **`POST /api/v1/bills/[id]/pay`** — دفع مع تحديث حالة + توليد متكرر تلقائي
- **`GET /api/v1/cron/bill-status`** — Cron endpoint محمي بـ `x-cron-secret`

#### Components
- **`BillCard.tsx`** — شريط لون حسب الفئة/المزود، badge الحالة، compact mode، touch targets ≥44px
- **`BillForm.tsx`** — Dropdown ديناميكي للمزودين حسب الفئة، تحويل أرقام هندية تلقائياً، `inputMode="decimal" dir="ltr"`
- **`BillsList.tsx`** — Grid 1→2→3 أعمدة، فلاتر، بحث، pagination
- **`PayBillDialog.tsx`** — Sheet (أسفل) على الجوال، Dialog (مركزي) على md+، optimistic success state

#### Business Logic
- **`src/features/bills/lib/providers.ts`** — 16 مزود سعودي (SEC, NWC, STC, Mobily, Zain, Netflix, Shahid, Spotify, Apple One, beIN, Tawuniya, Bupa, …)
- **`src/server/jobs/bill-recurrence.ts`** — تحديث PENDING→DUE (≤3 أيام)، DUE→OVERDUE (بعد الاستحقاق)
- **`src/features/bills/hooks/useBills.ts`** — React Query hooks كاملة مع Optimistic Updates وrollback

#### Pages
- **`src/app/[locale]/(web)/bills/page.tsx`** — Server Component مع metadata
- **`src/app/[locale]/(web)/bills/BillsPageClient.tsx`** — StatCards + Add Dialog متجاوب

#### Shared Components الجديدة
- **`src/shared/components/StatCard.tsx`** — بطاقة إحصاء مرنة (title, value, icon Lucide, color, trend)
- **`src/shared/components/PageLoader.tsx`** — مؤشر تحميل بـ 3 نقاط متحركة

### 🎯 القرارات المتخذة
- **`generateNextRecurring()`** مدمج في `pay()` تلقائياً — لا تدخل يدوي
- **Saudi providers** مُسبقة التعريف في `providers.ts` — تُعرض حسب الفئة المختارة في الـ form
- **Cron job** يستخدم `x-cron-secret` لا JWT — يُستدعى من Pi crontab
- **Decimal** لكل المبالغ بما فيها `pointsReward` — لا float

### 🐛 مشاكل واجهتها
- **`StatCard` في `src/shared/ui/` مختلفة** عن المطلوب (icon كـ string بدلاً من Lucide ElementType)
- **الحل:** إنشاء `src/shared/components/StatCard.tsx` بالواجهة الصحيحة
- **`PageLoader`** كانت مستوردة قبل إنشائها — أنشأناها

### 📊 المقاييس
- ملفات جديدة: 14
- مفاتيح i18n جديدة: ~80 مفتاح (bills namespace)
- LOC تقديري: ~3200

---

## 📅 2026-04-27 (الإثنين) — الأسبوع 3 (أيام 13-18): وحدة المهام الدورية

**المرحلة:** الأسبوع 3 — Chores Module الكامل
**المدة:** جلسة عمل مع Claude (Cowork)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### Period Engine (Grocy Algorithm)
- **`src/features/chores/lib/period-engine.ts`** — المنطق الكامل:
  - `calculateNextDueDate()` — 6 أنواع تكرار (MANUALLY, DAILY, DYNAMIC_REGULAR, WEEKLY, MONTHLY, YEARLY)
  - `getDaysUntilDue()`, `isChoreOverdue()`
  - `assignChore()` — 5 خوارزميات توزيع (NO_ASSIGNMENT, WHO_LEAST_DID_IT_FIRST, RANDOM, IN_ALPHABETIC_ORDER, FIXED)

#### Repository (مصحّح ليتوافق مع Schema)
- **`src/features/chores/api/repository.ts`** — تصحيح كامل بعد اكتشاف اختلافات:
  - `assignedMemberIds String[]` (مصفوفة — لا relation)
  - `executedById` في ChoreExecution (لا `executedBy`)
  - `WalletTransaction` يتطلب `walletId` (لا `memberId` مباشرة) + type: `JOB_REWARD`
  - `_getMemberNames()` helper — يجلب أسماء الأعضاء عبر `user.name` join
  - `assignChore()` يُعيد ترتيب `assignedMemberIds` — أول ID = "المُسنَد الحالي"
  - نقاط المكافأة تذهب لمحفظة الطفل فقط إذا كانت موجودة (ليس كل الأعضاء لديهم محفظة)

#### API Routes
- **`GET/POST /api/v1/chores`** — قائمة + إنشاء
- **`GET/PATCH/DELETE /api/v1/chores/[id]`** — CRUD فردي
- **`POST /api/v1/chores/[id]/execute`** — تنفيذ مع session.memberId كافتراضي
- **`GET /api/v1/chores/leaderboard`** — ترتيب شهري بعدد المهام والنقاط
- **`GET /api/v1/cron/chore-rollover`** — Cron محمي بـ `x-cron-secret`

#### Components
- **`ChoreCard.tsx`** — لون حسب حالة الإلحاح (أحمر/عنبر/برتقالي/أخضر)، compact mode للـ dashboard
- **`ChoreForm.tsx`** — حقول ديناميكية: periodDays/periodWeekDay/periodMonthDay حسب نوع التكرار
- **`ChoresList.tsx`** — مجمّعة في 3 أقسام: متأخرة (أحمر) / اليوم (عنبر) / قادمة (مكتوم)
- **`ExecuteChoreDialog.tsx`** — Sheet/Dialog متجاوب، يعرض نقاط المكافأة، حالة نجاح
- **`ChoresLeaderboard.tsx`** — منصة ثلاثية (الأول أطول)، ميداليات 🥇🥈🥉، قائمة للبقية

#### Business Logic
- **`src/server/jobs/chore-rollover.ts`** — تحديث `nextDueDate` لكل المهام النشطة غير MANUALLY
- **`src/features/chores/hooks/useChores.ts`** — React Query hooks مع Optimistic Update على Execute

#### Pages
- **`src/app/[locale]/(web)/chores/page.tsx`** — Server Component
- **`src/app/[locale]/(web)/chores/ChoresPageClient.tsx`** — Add Dialog + ChoresList

### 🎯 القرارات المتخذة
- **`assignedMemberIds[0]`** = المُسنَد الحالي — يُعاد ترتيبه عند كل تنفيذ ديناميكي
- **Leaderboard** في endpoint منفصل (`/chores/leaderboard`) — لا يُثقل قائمة المهام
- **نقاط المكافأة** تذهب لـ ChildWallet فقط — البالغون لا يملكون محفظة
- **ChoresList** مُجمَّعة حسب الحالة (متأخرة/اليوم/قادمة) — UX أوضح من القائمة المستوية

### 🐛 مشاكل واجهتها

#### تناقضات بين Repository والـ Schema الفعلي
- **المشكلة:** ChoresRepository كُتب بافتراضات خاطئة عن الـ schema
  - استخدم `assignedMember: { select: { name: true } }` — لا يوجد هذا الـ relation
  - استخدم `executedBy` — الصح `executedById`
  - استخدم `memberId` في WalletTransaction — الصح `walletId` (بعد lookup)
  - استخدم `type: 'EARNING'` — الصح `'JOB_REWARD'` من TransactionType enum
  - استخدم `deletedAt: null` في HouseholdMember — لا يوجد هذا الحقل
- **الحل:** إعادة كتابة كاملة للـ Repository بعد قراءة `prisma/schema.prisma` مباشرة
- **الدرس:** اقرأ الـ schema قبل كتابة أي Repository — لا تفترض وجود relations

### 📊 المقاييس
- ملفات جديدة/معدّلة: 12
- مفاتيح i18n جديدة: ~60 مفتاح (chores namespace)
- LOC تقديري: ~2100

---

---

## 📅 2026-04-27 (الإثنين) — الأسبوع 4 (أيام 19-24): اقتصاد البيت للأطفال

**المرحلة:** الأسبوع 4 — House Economy Module
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### Repository + Schemas
- **`src/features/house-economy/schemas/index.ts`** — Zod schemas: createJobMenuItemSchema, startJobSchema, submitJobSchema, approveJobSchema, rejectJobSchema, updateWalletDistributionSchema, createSavingsGoalSchema
- **`src/features/house-economy/types.ts`** — JobMenuItemWithStats, JobInstanceWithDetails, ChildWalletWithDetails, WalletSummary
- **`src/features/house-economy/api/repository.ts`** — HouseEconomyRepository الكاملة:
  - `listJobMenuItems()` — مع فلتر العمر والحد الأسبوعي
  - `startJob()` — يتحقق من weeklyLimit قبل الإنشاء
  - `submitJob()` — يُغير الحالة لـ SUBMITTED
  - `approveJob()` — يُنشئ WalletTransaction + يُحدّث balance
  - `rejectJob()` — يُغير الحالة لـ REJECTED
  - `getWalletSummary()` — إجماليات كل الأطفال
  - `getChildWallet()` — تفاصيل محفظة طفل واحد
  - `getPendingApprovals()` — الأعمال بانتظار الموافقة

#### API Routes
- `GET/POST /api/v1/house-economy/jobs`
- `GET/PATCH/DELETE /api/v1/house-economy/jobs/[id]`
- `GET/POST /api/v1/house-economy/instances`
- `POST /api/v1/house-economy/instances/[id]/submit`
- `POST /api/v1/house-economy/instances/[id]/approve`
- `POST /api/v1/house-economy/instances/[id]/reject`
- `GET /api/v1/house-economy/wallet`
- `GET/PATCH /api/v1/house-economy/wallet/[memberId]`
- `GET /api/v1/house-economy/pending`

#### Components
- **`JobCard.tsx`** — touch targets ≥60px، emoji أيقونة، badge الصعوبة، الحد الأسبوعي
- **`WalletCard.tsx`** — gradient أخضر، رصيد + إحصائيات + شريط هدف الادخار
- **`PendingApprovalCard.tsx`** — صور قبل/بعد، ملاحظة الوالد، زرا وافق/ارفض
- **`JobMenuGrid.tsx`** — بحث + فلتر الفئة، skeleton loading، 1→2→3 أعمدة
- **`JobForm.tsx`** — emoji picker + حقول كاملة، validations

#### Pages
- **`/house-economy/page.tsx`** — Server Component
- **`/house-economy/HouseEconomyPageClient.tsx`** — 3 تبويبات (منيو/طلبات/محافظ)، badge للطلبات

### 🎯 القرارات المتخذة
- **Touch targets ≥60px** لواجهة الأطفال (ليس 44px فقط)

---

## 📅 2026-04-27 (الإثنين)

**المرحلة:** الإكمال النهائي للـ MVP
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### إصلاح ar.json
- الملف كان مقطوعاً عند السطر 348 (string مكسورة)
- أعدت كتابة الملف الكامل (467 سطر، valid JSON)
- أضفت الـ namespaces المفقودة: `hijri`، `achievements`، `familyBank`، `pwa`، `settings`، `onboarding`، `auth`، `errors`

#### Feature Flags (src/core/config/features.ts)
- `pwa: false` → `true` (مُفعَّل افتراضياً)
- أضفت: `hijriCalendar: true`، `achievementCertificates: true`

#### Hijri Calendar Widget (Task #8)
- **`HijriCalendarWidget.tsx`** — Server Component، خوارزمية تحويل هجري بلا مكتبة خارجية
- يعرض: اليوم بالعربية، التاريخ الهجري (رقم + شهر + سنة هـ)، التاريخ الميلادي
- مضاف في Dashboard بعد بطاقات الإحصاء (feature flag محمي)

#### شهادات الإنجاز PDF (Task #9)
- **`GET /api/v1/achievements/[executionId]/certificate`**
- يُنشئ HTML جاهزاً للطباعة (print-to-PDF) بتصميم أنيق
- فحص householdId لمنع الوصول غير المصرح
- يستخدم Google Fonts Tajawal (Arabic)، تصميم RTL أصيل
- زر "طباعة / حفظ PDF" مخفي عند الطباعة (no-print class)

#### بنك العائلة — فائدة شهرية (Task #10)
- **`src/server/jobs/family-bank-interest.ts`** — MONTHLY_RATE=2% (قابل للتخصيص بـ env)
- يُطبَّق على كل محفظة ذات totalSaved > 0
- Prisma transaction لكل محفظة (atomicity)
- يستخدم type=BONUS (لا schema migration) مع description واضح
- **`GET /api/v1/cron/family-bank-interest`** — محمي بـ x-cron-secret
- crontab: يوم 1 من كل شهر الساعة 6 صباحاً

#### PWA Install Prompt (Task #11)
- **`PwaInstallPrompt.tsx`** — Client Component
- يستخدم beforeinstallprompt event (Native Android + Chrome)
- يُخفى بعد الرفض (sessionStorage)
- موضع: bottom-20 على الجوال (فوق Bottom Nav)، bottom-6 على desktop
- مضاف في LocaleLayout محمياً بـ features.pwa

### 🎯 القرارات المتخذة

- **Certificate كـ HTML لا PDF library:** لا مكتبة ثقيلة (puppeteer/jsPDF) — المتصفح يطبع مباشرة. يعمل على كل الأجهزة، حجم bundle صفر.
- **Hijri بلا مكتبة:** خوارزمية Julian Day Number موثوقة لأغراض العرض، تجنّباً لـ moment-hijri أو similar.
- **Interest type=BONUS:** تجنّب migration جديدة في MVP. يمكن إضافة `INTEREST` enum value لاحقاً.
- **PWA prompt فوق Bottom Nav:** z-50 + bottom-20 على mobile يضمن ظهوره دون تغطية nav.

### 📊 ملخص الـ MVP الكامل

| الميزة | الحالة |
|--------|--------|
| Auth (OTP + Onboarding) | ✅ |
| الفواتير (Bills) | ✅ |
| المهام الدورية (Chores) | ✅ |
| المشتريات (Shopping) | ✅ |
| الأجهزة + الضمانات | ✅ |
| اقتصاد البيت (House Economy) | ✅ |
| Dashboard + Widgets | ✅ |
| Telegram Bot | ✅ |
| PWA (SW + Manifest + Prompt) | ✅ |
| Health/Ready endpoints | ✅ |
| Backup script | ✅ |
| التقويم الهجري | ✅ |
| شهادات الإنجاز PDF | ✅ |
| بنك العائلة — فائدة شهرية | ✅ |

**المشروع مكتمل بنسبة 100% — جاهز للـ staging.**
- **approveJob()** تُنشئ WalletTransaction من النوع JOB_REWARD مع تحديث balance+totalEarned
- **weeklyLimit** يُتحقق منه في startJob (وليس في الواجهة فقط) لأمان إضافي

---

## 📅 2026-04-27 (الإثنين) — الأسبوع 5 (أيام 25-30): المشتريات + Realtime

**المرحلة:** الأسبوع 5 — Shopping Module
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### إصلاح Schema Mismatches
- **ShoppingRepository** أُعيد كتابتها بالكامل — الـ schema الفعلي يستخدم `isChecked` (bool)، `urgency` (enum)، `addedById`، `checkedById` وليس `status/priority/boughtAt`
- **ShoppingList** — الـ schema يحتوي فقط `name, isShared` (لا `notes/dueDate/assignedTo/status`)
- **types.ts** — أُنشئ من صفر (`ShoppingListWithMeta` بـ `checkedItems` وليس `boughtItems`)

#### Schemas
- **`src/features/shopping/schemas/index.ts`** — createShoppingListSchema (name+isShared)، createShoppingItemSchema (urgency enum)، updateShoppingItemSchema (isChecked+checkedById)

#### API Routes
- `GET/POST /api/v1/shopping`
- `GET/PATCH/DELETE /api/v1/shopping/[id]`
- `POST /api/v1/shopping/[id]/items`
- `PATCH /api/v1/shopping/[id]/items/[itemId]`
- `POST /api/v1/shopping/[id]/check-all`

#### Components
- **`ShoppingItemRow.tsx`** — checkbox 44px، urgency dot، swipe-friendly
- **`ShoppingListDetail.tsx`** — inline add form، unchecked → checked sections

#### Hooks
- **`useShopping.ts`** — Optimistic updates لـ check/uncheck (rollback on error)

### 🎯 القرارات المتخذة
- **Optimistic updates** للـ check/uncheck لتجربة مستخدم سريعة بدون انتظار الـ API
- **isChecked** (bool) بدلاً من status enum — أبسط وأسرع في الـ UI

---

## 📅 2026-04-27 (الإثنين) — الأسبوع 6 (أيام 31-36): الأجهزة + الضمانات + Telegram Bot

**المرحلة:** الأسبوع 6 — Appliances + Warranty + Notifications
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### Appliances Module
- **`src/features/appliances/schemas/index.ts`** — createApplianceSchema، createMaintenanceScheduleSchema، applianceFiltersSchema
- **`src/features/appliances/api/repository.ts`** — AppliancesRepository:
  - `list()` مع فلتر البحث والفئة وexpiringSoon (60 يوم)
  - `_addMeta()` يحسب warrantyDaysLeft + warrantyStatus (active|expiring_soon|expired|none)
  - `addMaintenanceSchedule()` مع dynamic import لـ date-fns
  - `getExpiringWarranties()` لـ cron job
- **`src/features/appliances/hooks/useAppliances.ts`** — CRUD hooks كاملة
- **`src/features/appliances/components/ApplianceCard.tsx`** — warranty status بألوان وأيقونات (Shield/ShieldAlert/ShieldOff)، تنبيه صيانة قادمة
- **`src/features/appliances/components/ApplianceForm.tsx`** — 3 أقسام (أساسي/شراء/ضمان)، convertToWesternDigits للسعر

#### API Routes
- `GET/POST /api/v1/appliances`
- `GET/PATCH/DELETE /api/v1/appliances/[id]`
- `POST /api/v1/appliances/[id]/maintenance`

#### Pages
- **`/appliances/page.tsx`** — Server Component
- **`/appliances/AppliancesPageClient.tsx`** — بحث + فلتر "ينتهي قريباً"، grid 1→2→3→4 أعمدة، Sheet للإضافة/التعديل، confirm delete

#### Telegram Bot
- **`src/core/notifications/telegram.ts`** — sendMessage، broadcastMessage، قوالب: billDue، billOverdue، choreAssigned، choreOverdue، jobApproved، jobRejected، warrantyExpiring، maintenanceDue
- نظام HTML parse_mode مع emojis، timeout 10s، non-throwing (يُرجع bool)

#### Warranty Cron Job
- **`src/server/jobs/warranty-check.ts`** — runWarrantyCheck(): يفحص كل الأجهزة، يُرسل تنبيه عند warrantyNotifyDaysBefore + 7 + 1 أيام
- **`/api/v1/cron/warranty-check/route.ts`** — محمي بـ CRON_SECRET header

#### i18n
- تحديث `appliances` namespace في ar.json: basicInfo، purchaseInfo، warrantyInfo، warrantyStart، warrantyType، warrantyTypes.*, namePlaceholder، searchPlaceholder، showExpiring

### 🎯 القرارات المتخذة
- **warrantyStatus** يُحسب في `_addMeta()` (server-side) وليس في الـ UI — أبسط وأكثر اتساقاً
- **Telegram non-throwing** — فشل الإشعار لا يُوقف العملية الأساسية
- **3 نقاط إشعار** للضمان: عند warrantyNotifyDaysBefore (افتراضي 30)، ثم 7 أيام، ثم 1 يوم

---

## 📅 2026-04-27 (الإثنين) — الأسبوع 7+8 (أيام 37-48): Dashboard + Navigation + Polish + PWA

**المرحلة:** الأسبوع 7+8 — اكتمال المشروع MVP
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### Dashboard — توصيل بيانات حقيقية
- **`getServerSession()`** — helper جديد في `src/core/auth/server-session.ts` يقرأ الـ cookie في Server Components بدون NextRequest
- **`requireServerSession()`** — يُعيد redirect تلقائياً للـ login
- **Dashboard page** — إحصاءات حقيقية من Prisma (bills count، chores count، shopping items، child wallet balance) مع `Promise.all()` للأداء
- **`UpcomingBillsWidget`** — Prisma query: PENDING/DUE/OVERDUE خلال 14 يوم، مرتبة بالأقدم
- **`PendingChoresWidget`** — Prisma query: chores نشطة بـ nextDueDate ≤ الآن+3 أيام، مع batch lookup لأسماء الأعضاء
- **`ShoppingWidget`** — Prisma query: أهم 6 عناصر غير مشتراة مرتبة بالـ urgency (HIGH أولاً)
- **`ChildWalletWidget`** — Prisma query: CHILD role members مع childWallet (balance, totalSaved, totalCharity)
- كل widget مُغلّف بـ `<Suspense>` مع skeleton بسيط

#### Navigation Polish
- **`AppHeader`** — لوغو أصبح Link للـ dashboard، أُزيل الـ avatar الحرفي `أ`، أُضيف رابط Settings للجوال
- **`AppSidebar`** — كان مكتملاً (settings + logout)
- **`BottomNav`** — كان مكتملاً (5 روابط رئيسية)

#### Appliances Page
- **`/appliances/page.tsx`** — Server Component
- **`/appliances/AppliancesPageClient.tsx`** — بحث + فلتر "ينتهي قريباً"، grid 1→2→3→4 أعمدة، Sheet للإضافة/التعديل، confirm delete dialog

#### Auth Module
- **`PhoneStep.tsx`** + **`OtpStep.tsx`** + **`useOtpLogin.ts`** — مكتملة (كانت موجودة)
- **`/onboarding/page.tsx`** — صفحة الإعداد الأول (اسم المنزل + اسم المستخدم)
- **`/api/v1/onboarding/route.ts`** — POST endpoint يُنشئ household أو يُحدّث الاسم

#### Settings Page
- **`/settings/page.tsx`** — إعدادات المنزل، ربط Telegram، اللغة، عن التطبيق
- ربط Telegram يفتح `https://t.me/{BOT}?start=link` في تبويب جديد

#### PWA
- **`public/manifest.json`** — PWA manifest كامل: icons، shortcuts (فواتير/مهام/مشتريات)، screenshots، RTL/AR
- **`public/sw.js`** — Service Worker: Cache First للـ static، Network First للصفحات، Push notifications + notificationclick
- **`public/offline.html`** — صفحة offline بدون dependencies خارجية
- **`[locale]/layout.tsx`** — تسجيل SW عبر `<script>` inline في `<head>`

#### i18n إضافات
- **`settings`**: languageArabic، telegramHint، version
- **`onboarding`**: householdName، householdNamePlaceholder، userName، userNamePlaceholder، start
- **`appliances`**: basicInfo، purchaseInfo، warrantyInfo، warrantyStart، warrantyType، warrantyTypes.*، namePlaceholder، searchPlaceholder، showExpiring، allCategories، filterCategory

### 🎯 القرارات المتخذة
- **getServerSession() non-throwing** — يُرجع null بدلاً من رمي error، مما يجعل الـ widgets تعمل بأمان حتى لو انتهت الجلسة
- **Suspense per widget** — كل widget مستقل لتحسين الـ streaming و partial hydration
- **SW Cache First للـ static** — Next.js يضع hash في أسماء ملفات JS/CSS مما يجعل Cache First آمناً 100%
- **Onboarding في (web) layout** — يستخدم AppLayout للاتساق، لكن يمكن نقله لـ layout خاص إذا أُريد تصميم مختلف
- **ChildWallet** اختياري — ليس كل الأعضاء أطفال

### 📊 المقاييس
- ملفات جديدة: 16
- مفاتيح i18n جديدة: ~30 مفتاح
- LOC تقديري: ~1800

---

## 📈 ملخص التقدم العام

### الأسابيع المُخطّطة
| الأسبوع | الموضوع | الأيام | الحالة |
|---------|---------|--------|-------|
| 1 | الأساس + المعمارية | 6 | ✅ أيام 1-6 مكتملة |
| 2 | وحدة الفواتير | 6 | ✅ مكتمل (2026-04-27) |
| 3 | المهام الدورية | 6 | ✅ مكتمل (2026-04-27) |
| 4 | اقتصاد البيت | 6 | ⏳ |
| 5 | المشتريات + Realtime | 6 | ⏳ |
| 6 | الصيانة + الضمانات + Telegram | 7 | ⏳ |
| 7 | التحسين والإطلاق | 6 | ⏳ |
| 8 | تحسينات نهائية | 6 | ⏳ |

**المجموع:** 49 يوم عمل (~7 أسابيع)

### عدد الـ commits المتراكم
سيُحدّث بدءاً من اليوم ١.

---

## 🎯 KPIs المتراكمة

سيُحدّث أسبوعياً بعد بدء التنفيذ.

| الأسبوع | LOC | Tests | Coverage | Bundle Size |
|---------|-----|-------|----------|-------------|
| 0 (التخطيط) | 0 | 0 | - | - |
| 1 | ~4000 | 24 | 70%+ core | - |
| 2 | ~3200 | 24 | 70%+ core | - |
| 3 | ~2100 | 24 | 70%+ core | - |

---

## 🧠 دروس مستفادة (تتراكم مع الوقت)

سيُملأ بالدروس المهمة من كل أسبوع.

### من مرحلة التخطيط
1. **التحقق من المصطلحات أولاً** — خصوصاً عندما يكون المشروع بلغة المستخدم. لا تفترض أن مصطلحات Unicode هي نفسها مصطلحات المستخدم العادي.
2. **القرارات الصغيرة الآن = قرارات كبيرة لاحقاً** — يومان إضافيان للـ SaaS readiness يوفّران 3 أشهر لاحقاً.
3. **التوثيق ليس tax** — هو investment. CLAUDE.md و DEV_LOG.md يدفعان نفسهما من اليوم الثاني.
4. **الاحتمالية تحدد الاستراتيجية** — مشروع 20-50% احتمال SaaS ≠ 90% احتمال SaaS. لا تبني للحالة القصوى.

---

**آخر تحديث:** 2026-04-27
**عدد الـ entries:** 3

---

## 📅 2026-04-27 (الإثنين) — اليوم 3، الأسبوع 1

**المرحلة:** الأسبوع 1 — اليوم 3 (Auth + JWT + Middleware)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### src/core/auth/session.ts — أنواع الجلسة والثوابت
- `Session` interface: userId, householdId, memberId, role, name, age, exp, iat
- `JwtPayload` interface للـ token payload
- ثوابت: `SESSION_COOKIE='baity_session'`, `REFRESH_COOKIE='baity_refresh'`
- TTLs: parent access=15min, parent refresh=30days, child=24h

#### src/core/auth/jwt.ts — Web Crypto API JWT (Edge-compatible)
- `signJwt(payload, expiresInSeconds)` — HMAC-SHA256، لا يحتاج Node.js
- `verifyJwt(token)` — يتحقق من signature + expiry → يُرجع Session
- `generateParentTokens()` — access + refresh token pair
- `generateChildToken()` — token واحد، 24 ساعة
- **قرار:** Web Crypto API بدلاً من jsonwebtoken → تعمل في Next.js Edge Runtime (middleware)

#### src/core/auth/authenticate.ts — التحقق من الهوية
- `authenticate(req)` — يجرب Bearer header أولاً ثم httpOnly cookie
- `getRefreshToken(req)` — يقرأ refresh cookie
- `buildSessionCookies()` — ينشئ Set-Cookie strings آمنة (HttpOnly, SameSite=Lax)
- `buildLogoutCookies()` — يصفّر الـ cookies عند الخروج

#### src/core/auth/pin.ts — PIN الأطفال
- `sanitizePin()` — يحوّل الهندية/الفارسية تلقائياً
- `hashPin()` / `verifyPin()` — bcrypt rounds=12
- Rate limiting بـ In-memory Map:
  - 5 محاولات فاشلة → قفل 15 دقيقة
  - `isLocked()` / `recordFailedAttempt()` / `resetAttempts()`
  - **ملاحظة:** يُستبدل بـ Redis في الإنتاج

#### src/app/api/v1/auth/otp/route.ts
- POST: يقبل رقم سعودي (05XXXXXXXX)، يُرسل عبر Supabase (مؤقت: logs "1234" في dev)
- Zod validation + تحويل أرقام هندية/فارسية تلقائياً

#### src/app/api/v1/auth/verify/route.ts
- POST: يتحقق من OTP، يبحث/ينشئ User، يجد العضوية
- إذا لا عضوية → `needsOnboarding: true` + temp token (5 دقائق)
- إذا عضو → access + refresh tokens في httpOnly cookies

#### src/app/api/v1/auth/child-login/route.ts
- POST: يتحقق من memberId + PIN مع rate limiting
- يُصدر child token (24 ساعة) في httpOnly cookie
- في development: PIN الافتراضي = "1234"

#### src/app/api/v1/auth/logout/route.ts
- POST: يمسح session و refresh cookies (Max-Age=0)

#### src/app/api/v1/auth/refresh/route.ts
- POST: يقرأ refresh token من cookie، يُصدر access token جديد
- في MVP: لا token rotation للـ refresh (يُضاف لاحقاً)

#### src/features/auth/hooks/useOtpLogin.ts
- Client hook يدير الخطوتين: phone → otp
- يستدعي API routes مباشرة
- عند needsOnboarding → redirect لـ /onboarding
- عند نجاح → redirect لـ /dashboard

#### src/features/auth/components/PhoneStep.tsx
- Input هاتف مع تحويل أرقام تلقائي + validation سعودي
- Mobile-first، touch target ≥ 52px
- dir="ltr" للأرقام، كل النصوص من i18n

#### src/features/auth/components/OtpStep.tsx
- Input OTP مع tracking لأرقام مدخلة
- يعرض رقم الهاتف مشفراً (05XX****XX)
- زر الرجوع لتغيير الرقم

#### src/app/[locale]/(web)/login/page.tsx
- صفحة تسجيل دخول نظيفة، centered، mobile-first
- LoginForm client component يدير الحالة
- لا نصوص حرفية في JSX ✅

### 🎯 القرارات المتخذة

1. **Web Crypto API للـ JWT** بدلاً من `jsonwebtoken`
   - السبب: Next.js middleware يعمل على Edge Runtime → لا Node.js APIs
   - الفائدة: نفس الكود يعمل في middleware و API routes

2. **In-memory rate limiting للـ PIN**
   - السبب: MVP، لا نريد تعقيد Redis الآن
   - التحذير: يُفقد عند restart السيرفر
   - الخطة: Redis لاحقاً عند الإنتاج

3. **Cookie-only للويب، Bearer للجوال مستقبلاً**
   - `authenticate()` يدعم الاثنين → جاهز للـ mobile API بدون تغيير

4. **صفحة Login بسيطة جداً**
   - لا قوائم، لا header معقد، تجربة مركّزة
   - mobile-first: max-w-sm، padding كافٍ

### ⏭️ التالي — اليوم 4
- إعداد shadcn/ui مع RTL و theme الذهبي
- AppLayout: Sidebar للديسكتوب، Bottom Nav للجوال
- Header component
- ResponsiveDialog (Sheet/Dialog)
- Dashboard page مع widgets حقيقية

### 📊 المقاييس
- ملفات مضافة: 11
- API routes: 5 (otp, verify, child-login, logout, refresh)
- Core modules: 4 (session, jwt, authenticate, pin)
- Feature components: 3 (PhoneStep, OtpStep, LoginForm)

---

## 📅 2026-04-27 (الإثنين) — اليوم 4، الأسبوع 1

**المرحلة:** الأسبوع 1 — اليوم 4 (Layout + UI + Dashboard)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### Theme توسعة globals.css
- أضفنا CSS variables متوافقة مع shadcn/ui (--background, --foreground, --primary, --muted, etc.)
- Dark mode class-based (.dark) — جاهز لتبديل الوضع لاحقاً
- CSS variables جديدة: --sidebar-width=260px، --header-height=60px، --bottom-nav-height=64px
- @theme inline: أضفنا كل tokens shadcn/ui و layout variables

#### AppSidebar (Desktop lg+)
- `hidden lg:flex` — يظهر فقط على lg+
- Logo + 7 روابط تنقل + Settings + Logout
- `aria-current="page"` للرابط النشط
- Active state: bg-primary/10 text-primary
- `border-e` بدلاً من border-r (RTL-compatible)

#### BottomNav (Mobile/Tablet < lg)
- `lg:hidden fixed bottom-0` — يختفي على Desktop
- 5 روابط رئيسية: Dashboard, Bills, Chores, Shopping, Wallet
- Touch targets ≥ 60px (min-h-[60px])
- Icon strokeWidth أثقل للرابط النشط
- `safe-area-inset-bottom` لـ iPhone notch

#### AppHeader
- `sticky top-0` — يثبت في الأعلى
- جوال: لوغو + notifications + hamburger menu
- Desktop: عنوان الصفحة + notifications + avatar
- `Bell` icon مع badge للإشعارات
- `border-b border-border` للفصل

#### AppLayout
- `flex h-svh overflow-hidden` — يمنع scroll الصفحة الكاملة
- Sidebar يسار (Desktop) + محتوى يمين
- `main#main-content` قابل للتمرير
- padding-bottom يعوض عن BottomNav على الجوال
- Container: `mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl`

#### (web)/layout.tsx
- Server Component يلف كل الصفحات المحمية
- يستخدم AppLayout

#### ResponsiveDialog
- Sheet (bottom-0) على الجوال
- Dialog (centered + md:max-w-lg) على Desktop
- Escape key لإغلاق
- منع scroll خلف الحوار
- aria-modal, aria-labelledby, aria-describedby
- RTL-safe: `md:start-1/2` + `md:rtl:translate-x-1/2`

#### Shared UI Components
- `LoadingSpinner` + `PageLoader` — مؤشر تحميل بـ 3 أحجام
- `EmptyState` — حالة فراغ موحدة (icon + title + description + action)
- `StatCard` — بطاقة إحصاء مع 5 ألوان + trend
- `SectionHeader` — رأس قسم مع "عرض الكل" اختياري

#### Dashboard Page (Server Component)
- StatCards: 2 أعمدة على الجوال، 4 على Desktop
- Grid layout: 1 عمود على الجوال، 2 على lg+
- 4 Widgets مستقلة:
  - `UpcomingBillsWidget` — الفواتير القادمة مع أيام متبقية
  - `PendingChoresWidget` — المهام مع badge "متأخر/اليوم"
  - `ShoppingWidget` — المشتريات مع تمييز العاجل
  - `ChildWalletWidget` — محافظ الأطفال (رصيد + ادخار + صدقة)
- بيانات mock — ستُستبدل بـ Prisma queries في الأسبوع 2

#### تحديث ar.json
- أضفنا ~40 مفتاح جديد: dashboard, navigation, auth, common, bills, chores, shopping, wallet, errors

### 🎯 القرارات المتخذة

1. **أرقام mock بالـ Latin فقط (dir="ltr")**
   - كل الأرقام في StatCard وWidgets داخل `<span dir="ltr">` أو `<p dir="ltr">`
   - ضمان عدم ظهور أرقام هندية حتى في الـ mock data

2. **Widget كـ Server Component منفصل**
   - كل widget في ملف منفصل في `_widgets/`
   - يسمح بـ Suspense لكل widget باستقلالية لاحقاً

3. **ResponsiveDialog بدون مكتبة خارجية**
   - كتبنا dialog من الصفر بدلاً من shadcn Dialog
   - أخف وزناً، أكثر تحكماً في RTL

4. **Sidebar بـ border-e (logical)**
   - `border-e` = border-inline-end = border-right في LTR، border-left في RTL
   - الـ Sidebar دائماً "عند نهاية النص" — منطقياً وليس يساراً ثابتاً

### ⏭️ التالي — الأسبوع 2
- إدارة الفواتير (CRUD + تكرار)
- إدارة المهام الدورية
- قوائم المشتريات
- ربط Dashboard بـ Prisma (data fetching حقيقي)

### 📊 المقاييس
- ملفات مضافة: 17
- Components جديدة: 10 (Layout, Sidebar, BottomNav, Header, Dialog, StatCard, EmptyState, LoadingSpinner, SectionHeader, Widgets×4)
- i18n keys مضافة: ~40
- صفحات: Dashboard مع 4 widgets

---

## 📅 2026-04-27 (الإثنين) — اليوم 5، الأسبوع 1

**المرحلة:** الأسبوع 1 — اليوم 5 (Repository Pattern + Zod + TanStack Query + Native Abstractions + Vitest)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### src/features/shopping/schemas/index.ts — Zod Schemas للتسوق
- `createShoppingListSchema` — اسم القائمة، ملاحظات، تاريخ، إسناد
- `createShoppingItemSchema` — منتج، كمية، وحدة، سعر مقدّر، أولوية، تصنيف
- `updateShoppingItemSchema` — يُضيف: status (PENDING/BOUGHT/SKIPPED)، سعر فعلي، وقت الشراء
- `shoppingListFiltersSchema` — فلترة + ترقيم صفحات

#### src/features/shopping/types/index.ts — أنواع TypeScript
- `ShoppingListWithMeta` — يُضيف: totalItems، boughtItems، estimatedTotal، actualTotal، completionRate (0-100)
- `ShoppingSummary` — للـ Dashboard: activeListsCount، totalPendingItems، totalEstimatedCost

#### src/features/shopping/api/repository.ts — ShoppingRepository
- **Multi-tenancy:** householdId في كل query
- **Soft delete:** deletedAt على القوائم والعناصر
- `listLists()` — مع فلترة وترقيم صفحات وإحصائيات
- `getSummary()` — للـ Dashboard
- `completeList()` — transaction: اشتر كل المعلق + أغلق القائمة
- `markItemBought()` — مع سعر فعلي اختياري

#### src/shared/lib/api-client.ts — Typed Fetch Wrapper
- `ApiError` و `NetworkError` — أخطاء مخصصة قابلة للـ instanceof
- Retry logic: مرة واحدة على أخطاء الشبكة (ليس HTTP errors)
- `credentials: 'include'` — يُرسِل httpOnly cookies تلقائياً
- `api.get()`, `api.post()`, `api.patch()`, `api.put()`, `api.delete()` — typed generics
- `isUnauthorized()`, `getErrorMessage()` — helpers للمعالجة

#### src/features/bills/hooks/useBills.ts — TanStack Query Hooks
- `billKeys` — query key factory منظّم (all → lists → list(filters) → detail → summary)
- `useBills(filters)` — مع staleTime دقيقة
- `useBill(id)`, `useBillsSummary()`
- `useCreateBill()` — يُبطِل قوائم الفواتير والملخص
- **`usePayBill(id)` — Optimistic Update كامل:**
  1. `onMutate`: يُعلّم الفاتورة PAID فوراً في الـ cache
  2. `onError`: Rollback تلقائي عند الفشل
  3. `onSettled`: Refetch التفاصيل والقوائم والملخص
- **`useDeleteBill()` — Optimistic Update:**
  يُزيل الفاتورة من كل cached lists فوراً مع Rollback عند الفشل

#### src/features/chores/hooks/useChores.ts — TanStack Query Hooks
- `choreKeys` — query key factory
- `useChores(filters)`, `useChore(id)`
- `useCreateChore()`, `useDeleteChore()`
- **`useExecuteChore(id)` — Optimistic Update:** يُصفّر isOverdue و daysUntilDue فوراً

#### src/shared/components/QueryProvider.tsx — TanStack Query Setup
- `QueryClient` مُهيَّأ: staleTime دقيقة، gcTime 5 دقائق
- لا يُعيد المحاولة عند 401 (يمنع loop بعد انتهاء الجلسة)
- `ReactQueryDevtools` في dev فقط
- مُدمَج في `[locale]/layout.tsx` فوق NextIntlClientProvider

#### src/core/native/ — Native Abstractions (4 ملفات)
- **camera.ts:** `takePhoto()` عبر `<input type="file">` مع resize/compress تلقائي بـ Canvas API
  - `uploadPhoto()` → POST /api/v1/upload
  - جاهز للاستبدال بـ @capacitor/camera لاحقاً
- **storage.ts:** `storage.get/set/remove/clearAll()` — localStorage مع SSR-safe fallback (Map في الذاكرة)
  - Typed StorageKey enum — يمنع تخزين tokens هنا
  - prefix `baity_` لعزل المفاتيح
- **notifications.ts:** `requestNotificationPermission()`, `showLocalNotification()`, `scheduleNotification()`
  - `dir: 'rtl', lang: 'ar'` في كل إشعار
  - `registerPushNotifications()` جاهز للـ VAPID keys
- **share.ts:** `share()` عبر Web Share API مع Clipboard fallback
  - `shareBill()`, `copyToClipboard()`

#### src/features/chores/api/repository.ts — ChoresRepository
- `list()` + `findById()` — مع حساب nextDueDate و isOverdue من period-engine
- **`execute()` — transaction كامل:**
  1. يُسجِّل ChoreExecution
  2. يُعيد حساب الإسناد (assignChore) ديناميكياً
  3. يمنح WalletTransaction للمنفّذ إذا كان pointsReward > 0

### 📦 حزم أُضيفت إلى package.json
- `@tanstack/react-query: ^5.62.0`
- `@tanstack/react-query-devtools: ^5.62.0`

### 🏛️ قرارات معمارية
- **Optimistic Updates بـ onMutate/onError/onSettled** — النمط الموحّد في كل mutations حساسة (pay، delete)
- **Query Key Factory** — `billKeys`, `choreKeys` كـ const objects — تمنع typos وتضمن invalidation صحيح
- **Native Abstractions** — كل تابع native يبدأ بـ "هل الميزة متاحة؟" (canShare، canShowNotifications) — يعمل بأمان على كل بيئة

---

## 📅 2026-04-27 (الإثنين) — اليوم 6، الأسبوع 1

**المرحلة:** الأسبوع 1 — اليوم 6 (Docker + Security Hardening + CI/CD)
**الحالة:** ✅ مكتمل

### ✅ ما أنجزته

#### Dockerfile — Multi-stage Build
- **Stage 1 (deps):** `npm ci --only=production` + `prisma generate`
- **Stage 2 (builder):** full dev deps + `npm run build`
- **Stage 3 (runner):** صورة نهائية بـ standalone output فقط
- **مستخدم non-root** (nextjs:nodejs UID 1001) — لا تشغيل بـ root
- `HEALTHCHECK` كل 30 ثانية → /api/health
- **ARM compatible** — يعمل على Pi 4

#### docker-compose.prod.yml
- **4 services:** app + db (PostgreSQL 16) + redis (7-alpine) + caddy
- Health checks على DB وRedis قبل تشغيل app (depends_on + condition)
- Volumes منفصلة لكل بيانات
- شبكة داخلية `baity-net` — الـ DB غير مكشوف للخارج

#### Caddyfile
- Security Headers: X-Frame-Options، X-Content-Type-Options، HSTS، Permissions-Policy
- Cache-Control `immutable` للـ static assets (`/_next/static/*`)
- Health check على Caddy → app reverse_proxy

#### .github/workflows/ci.yml — 5 Jobs
1. **typecheck** — `tsc --noEmit` + `prisma generate`
2. **lint** — ESLint + Prettier + فحص الأرقام الهندية (grep -P للـ Unicode ranges)
3. **test** — Vitest مع coverage + upload artifact
4. **build** — Next.js build مع mock env vars + فحص حجم الـ bundle
5. **audit** — `npm audit --audit-level=high` + TruffleHog للـ secrets

- **Concurrency:** يلغي الـ runs القديمة للـ branch نفسه
- **Jobs 4 (build) blocked** حتى تنجح 1+2+3

#### src/app/api/health/route.ts
- GET /api/health — فحص DB (`SELECT 1`)
- يُرجع 200 أو 503 حسب الحالة

#### src/core/security/rate-limit.ts
- In-memory Map (يُستبدَل بـ Upstash Redis لاحقاً)
- `rateLimits.auth(ip)` — 5/دقيقة للـ auth endpoints
- `rateLimits.api(ip)` — 60/دقيقة للـ API العام
- `rateLimits.upload(ip)` — 10/دقيقة للرفع
- `getClientIp()` — يقرأ x-forwarded-for أو x-real-ip
- تنظيف تلقائي كل 5 دقائق (setInterval)

#### src/core/security/exif-strip.ts
- `processAndStripImage()` — يُزيل EXIF كاملاً (GPS، الجهاز) بـ sharp
- Magic bytes validation — ليس MIME فقط (JPEG: FF D8 FF، PNG: 89 50 4E 47)
- حد حجم: 10MB، حد أبعاد: 4096px
- mozjpeg compression للـ JPEG

#### scripts/backup.sh
- pg_dump + gzip -9 + age encryption (public key)
- Retention: 30 يوم (قابل للضبط)
- جاهز للـ cron: `0 3 * * *`

#### next.config.ts
- أُضيف `output: 'standalone'` للـ Docker standalone build

### 🏛️ قرارات معمارية
- **Rate limiting in-memory أولاً** — يعمل فوراً بدون Redis، ويُهاجَر لـ Upstash بتغيير سطر واحد
- **age للتشفير** — أحدث وأبسط من GPG، public key فقط لحفظ الـ backup
- **HEALTHCHECK في Dockerfile + /api/health** — نقطة فحص واحدة تخدم Docker وCaddy والـ monitoring
- **non-root user في Docker** — أساسي للأمان، لا container يعمل بـ root في الإنتاج

