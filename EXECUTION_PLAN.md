# 🗓️ خطة تنفيذ "بيتي" — ٦ أسابيع للـ MVP

> خطة يومية مفصّلة لبناء MVP إدارة المنزل على Raspberry Pi 4
> تستفيد من بيئتك الحالية (Docker, Telegram bots, Claude integration)

---

## 📋 الفرضيات الأساسية

- **بيئة التطوير:** Raspberry Pi 4 (192.168.100.64)
- **معدل العمل:** ٢-٣ ساعات يومياً، ٥-٦ أيام أسبوعياً
- **منهجية:** MVP-first، تجنب الـ over-engineering
- **اللغة:** كود إنجليزي + UI عربي
- **Stack:** Next.js 15 + PostgreSQL + Prisma + Telegram Bot

---

## 🎯 معايير النجاح للـ MVP

في نهاية ٦ أسابيع، يجب أن تتمكن عائلتك من:
1. ✅ تسجيل ٤ أعضاء (باسم، ريم، سعد، نورة) مع أدوار مختلفة
2. ✅ إضافة ١٠+ فواتير شهرية مع تنبيهات تلقائية قبل الاستحقاق
3. ✅ إنشاء ١٥+ مهمة دورية بأنواع تكرار مختلفة
4. ✅ قائمة مشتريات مشتركة محدّثة لحظياً بين الجميع
5. ✅ تتبع صيانة ٥+ أجهزة منزلية
6. ✅ استقبال إشعارات Telegram عند استحقاق فاتورة/مهمة
7. ✅ النظام يعمل بثبات لمدة أسبوعين دون تدخل

---

## 📅 الأسبوع ١: الأساس والمعمارية

> **الهدف:** بنية تحتية صلبة + قاعدة بيانات + Auth

### 🔹 اليوم ١ (السبت): إعداد المشروع

**المدة:** ٢-٣ ساعات

```bash
# على Pi
cd ~/projects
mkdir baity && cd baity

# إنشاء Next.js project
npx create-next-app@latest . --typescript --tailwind --app --src-dir
# - eslint: yes
# - import alias: @/*

# تثبيت الحزم الأساسية
npm install prisma @prisma/client
npm install @supabase/supabase-js
npm install lucide-react date-fns date-fns-jalali
npm install zod react-hook-form @hookform/resolvers
npm install clsx tailwind-merge

# Dev dependencies
npm install -D @types/node prettier prettier-plugin-tailwindcss
```

**إنشاء الملفات الأساسية:**
- `CLAUDE.md` — توثيق المشروع للأدوات الذكية
- `DEV_LOG.md` — سجل يومي للتطوير
- `.env.local.example` — متغيرات البيئة
- `docker-compose.yml` — لخدمات التطوير

**تشغيل PostgreSQL محلياً:**
```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: baity
      POSTGRES_PASSWORD: baity_dev
      POSTGRES_DB: baity_db
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
```

**Deliverable:** مشروع Next.js يعمل على `http://192.168.100.64:3000`

---

### 🔹 اليوم ٢ (الأحد): قاعدة البيانات + Prisma

**المدة:** ٣ ساعات

**Prisma Schema الكامل** (`prisma/schema.prisma`):

```prisma
// User & Household (من Splitastic)
model User {
  id            String    @id @default(cuid())
  phone         String    @unique
  name          String
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  memberships   HouseholdMember[]
}

model Household {
  id            String    @id @default(cuid())
  name          String           // "بيت العائلة"
  city          String?          // "الرياض"
  members       HouseholdMember[]
  bills         Bill[]
  chores        Chore[]
  shoppingLists ShoppingList[]
  appliances    Appliance[]
  createdAt     DateTime  @default(now())
}

model HouseholdMember {
  id          String    @id @default(cuid())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  household   Household @relation(fields: [householdId], references: [id])
  householdId String
  role        Role      @default(MEMBER)
  points      Int       @default(0)  // للأطفال
  joinedAt    DateTime  @default(now())

  @@unique([userId, householdId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  CHILD
}

// Bills (من HomeHub)
model Bill {
  id              String    @id @default(cuid())
  household       Household @relation(fields: [householdId], references: [id])
  householdId     String
  category        String    // "electricity", "telecom", "water", "subscription"
  provider        String?   // "STC", "SEC", "Mobily"
  accountNumber   String?
  title           String
  amount          Decimal   @db.Decimal(10, 2)
  dueDate         DateTime
  isRecurring     Boolean   @default(false)
  recurrencePeriod RecurrencePeriod?
  status          BillStatus @default(PENDING)
  paidAt          DateTime?
  attachmentUrl   String?
  notes           String?
  createdAt       DateTime  @default(now())
  payments        BillPayment[]
}

enum BillStatus { PENDING DUE PAID OVERDUE }
enum RecurrencePeriod { DAILY WEEKLY MONTHLY QUARTERLY YEARLY }

model BillPayment {
  id        String   @id @default(cuid())
  bill      Bill     @relation(fields: [billId], references: [id])
  billId    String
  amount    Decimal  @db.Decimal(10, 2)
  paidAt    DateTime
  notes     String?
}

// Chores (من Grocy — الجوهرة!)
model Chore {
  id                String    @id @default(cuid())
  household         Household @relation(fields: [householdId], references: [id])
  householdId       String
  name              String
  description       String?

  // 6 period types from Grocy
  periodType        PeriodType
  periodDays        Int?       // For DAILY, DYNAMIC_REGULAR
  periodWeekDay     Int?       // 0-6 for WEEKLY
  periodMonthDay    Int?       // 1-31 for MONTHLY

  // 4 assignment types from Grocy
  assignmentType    AssignmentType @default(NO_ASSIGNMENT)
  assignedMembers   String[]  // member IDs

  // Tracking
  firstExecutionDate DateTime  @default(now())
  nextDueDate       DateTime?
  lastExecutedAt    DateTime?
  lastExecutedBy    String?   // member ID

  // Features
  trackDateOnly     Boolean   @default(false)
  dueDateRollover   Boolean   @default(true)
  pointsReward      Int       @default(0)  // للأطفال
  notifyBeforeDays  Int       @default(1)

  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())

  executions        ChoreExecution[]
}

enum PeriodType {
  MANUALLY
  DAILY              // كل X يوم بانتظام
  DYNAMIC_REGULAR    // X يوم بعد آخر تنفيذ
  WEEKLY
  MONTHLY
  YEARLY
}

enum AssignmentType {
  NO_ASSIGNMENT
  WHO_LEAST_DID_IT_FIRST
  RANDOM
  IN_ALPHABETIC_ORDER
  FIXED                // ميزتنا — شخص واحد ثابت
}

model ChoreExecution {
  id          String   @id @default(cuid())
  chore       Chore    @relation(fields: [choreId], references: [id])
  choreId     String
  executedBy  String   // member ID
  executedAt  DateTime @default(now())
  notes       String?
  pointsAwarded Int    @default(0)
}

// Shopping
model ShoppingList {
  id          String    @id @default(cuid())
  household   Household @relation(fields: [householdId], references: [id])
  householdId String
  name        String    // "بقالة", "خضار"
  items       ShoppingItem[]
  createdAt   DateTime  @default(now())
}

model ShoppingItem {
  id          String       @id @default(cuid())
  list        ShoppingList @relation(fields: [listId], references: [id])
  listId      String
  name        String
  category    String?      // "ألبان", "خضروات"
  quantity    String?      // "2 كيلو", "×3"
  isChecked   Boolean      @default(false)
  addedBy     String       // member ID
  checkedAt   DateTime?
  createdAt   DateTime     @default(now())
}

// Appliances & Maintenance
model Appliance {
  id            String    @id @default(cuid())
  household     Household @relation(fields: [householdId], references: [id])
  householdId   String
  name          String    // "مكيف الصالة"
  brand         String?
  model         String?
  purchaseDate  DateTime?
  warrantyEnd   DateTime?
  notes         String?
  schedules     MaintenanceSchedule[]
}

model MaintenanceSchedule {
  id              String     @id @default(cuid())
  appliance       Appliance  @relation(fields: [applianceId], references: [id])
  applianceId     String
  taskName        String     // "تنظيف الفلتر"
  intervalDays    Int        // كل ٩٠ يوم
  lastDoneAt      DateTime?
  nextDueAt       DateTime
  notifyBeforeDays Int       @default(7)
  history         MaintenanceLog[]
}

model MaintenanceLog {
  id          String              @id @default(cuid())
  schedule    MaintenanceSchedule @relation(fields: [scheduleId], references: [id])
  scheduleId  String
  doneAt      DateTime            @default(now())
  doneBy      String?             // member ID
  cost        Decimal?            @db.Decimal(10, 2)
  notes       String?
  attachmentUrl String?
}
```

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Deliverable:** قاعدة بيانات كاملة + Prisma Client يعمل

---

### 🔹 اليوم ٣ (الإثنين): Auth + Layout أساسي

**المدة:** ٣ ساعات

- إعداد Supabase Auth (Phone OTP)
- إنشاء صفحات: `/login`, `/onboarding`, `/dashboard`
- Middleware للحماية
- Layout أساسي بالعربية + RTL
- خطوط Amiri + IBM Plex Sans Arabic

**Deliverable:** قدرة على التسجيل برقم الجوال + إنشاء بيت أول

---

### 🔹 اليوم ٤ (الثلاثاء): Dashboard هيكل أساسي

**المدة:** ٢ ساعات

- Sidebar مع التنقل
- 4 بطاقات إحصائية (مع mock data)
- Header مع التقويم الهجري (date-fns-jalali)
- Family widget مع الأعضاء

**Deliverable:** Dashboard فارغة لكن مكتملة بصرياً

---

### 🔹 اليوم ٥ (الأربعاء): UI Components Library

**المدة:** ٢ ساعات

- إعداد shadcn/ui مع RTL
- Components: Button, Card, Dialog, Input, Select, Avatar, Badge, Toast
- Theme provider (الألوان من الـ Mockup)

**Deliverable:** مكتبة UI جاهزة لبقية الأسابيع

---

### 🔹 اليوم ٦ (الخميس): مراجعة + Docker

**المدة:** ٢ ساعات

- إعداد `Dockerfile` للإنتاج
- `docker-compose.prod.yml` (Next.js + Postgres)
- إعداد Caddy لـ reverse proxy
- `git push` على repo `baity` على GitHub

**Deliverable:** يمكن نشر المشروع بـ `docker compose up`

---

## 📅 الأسبوع ٢: وحدة الفواتير

> **الهدف:** نظام فواتير كامل مع تنبيهات

### 🔹 اليوم ٧ (السبت): Bills CRUD

- API routes: `GET/POST/PUT/DELETE /api/bills`
- صفحة قائمة الفواتير
- Form لإضافة/تعديل فاتورة
- Validation بـ Zod

### 🔹 اليوم ٨ (الأحد): Bill Categories + Providers

- Seed بيانات: STC, SEC, Mobily, Zain, المياه الوطنية
- اختيار المزود من dropdown مع شعار
- تصنيفات ملوّنة (من HomeHub)

### 🔹 اليوم ٩ (الإثنين): Recurring Bills

- منطق توليد الفواتير المتكررة
- Cron job: كل يوم منتصف الليل، يولّد الفواتير الجديدة
- Worker بـ `node-cron` أو Vercel Cron

### 🔹 اليوم ١٠ (الثلاثاء): رفع الفواتير + Storage

- رفع صورة/PDF فاتورة
- Supabase Storage
- معاينة المرفقات

### 🔹 اليوم ١١ (الأربعاء): Bill Status & History

- منطق الحالات: PENDING → DUE → PAID/OVERDUE
- زر "دفع" مع تسجيل في BillPayment
- صفحة "تاريخ المدفوعات"

### 🔹 اليوم ١٢ (الخميس): Bills Dashboard Widget

- بطاقة "الفواتير القادمة" في Dashboard
- ربط الإحصائيات الحقيقية
- اختبار end-to-end للوحدة كاملة

**Deliverable الأسبوع:** وحدة فواتير كاملة وظيفياً

---

## 📅 الأسبوع ٣: وحدة المهام الدورية (الأهم)

> **الهدف:** تطبيق منطق Grocy الكامل بـ TypeScript

### 🔹 اليوم ١٣ (السبت): Chores CRUD أساسي

- نموذج إضافة مهمة بـ ٦ أنواع تكرار
- API routes
- صفحة قائمة المهام

### 🔹 اليوم ١٤ (الأحد): Period Calculation Engine

ملف `lib/chores/period-engine.ts`:

```typescript
export function calculateNextDueDate(
  chore: Chore,
  lastExecution: Date | null
): Date | null {
  if (chore.periodType === 'MANUALLY') return null;

  const baseDate = chore.periodType === 'DYNAMIC_REGULAR' && lastExecution
    ? lastExecution
    : (lastExecution || chore.firstExecutionDate);

  switch (chore.periodType) {
    case 'DAILY':
      return addDays(baseDate, chore.periodDays || 1);
    case 'WEEKLY':
      return nextSpecificWeekday(baseDate, chore.periodWeekDay!);
    case 'MONTHLY':
      return addMonths(baseDate, 1);
    case 'YEARLY':
      return addYears(baseDate, 1);
    case 'DYNAMIC_REGULAR':
      return addDays(baseDate, chore.periodDays || 1);
  }
}
```

### 🔹 اليوم ١٥ (الإثنين): Assignment Engine

ملف `lib/chores/assignment-engine.ts`:

```typescript
export async function getNextAssignee(chore: Chore): Promise<string | null> {
  switch (chore.assignmentType) {
    case 'WHO_LEAST_DID_IT_FIRST':
      return await findMemberWithLeastExecutions(chore);
    case 'RANDOM':
      return randomFromArray(chore.assignedMembers);
    case 'IN_ALPHABETIC_ORDER':
      return getNextInAlphabeticOrder(chore);
    case 'FIXED':
      return chore.assignedMembers[0];
    default:
      return null;
  }
}
```

### 🔹 اليوم ١٦ (الثلاثاء): Execute Chore

- زر "تم" في القائمة
- API: تسجيل ChoreExecution + حساب nextDueDate جديد
- منح النقاط للأطفال

### 🔹 اليوم ١٧ (الأربعاء): Due Date Rollover

- Cron يومي: للمهام المتأخرة + dueDateRollover=true → تحريك التاريخ
- إشعار للمهام التي اقترب موعدها

### 🔹 اليوم ١٨ (الخميس): Kids Points Page

- لوحة شرف الأطفال
- ترتيب أسبوعي/شهري
- مكافآت قابلة للتخصيص (لاحقاً)

**Deliverable الأسبوع:** نظام مهام دورية أقوى من Grocy نفسه

---

## 📅 الأسبوع ٤: قائمة المشتريات + Realtime

> **الهدف:** تحديث لحظي بين أفراد العائلة

### 🔹 اليوم ١٩ (السبت): Shopping Lists CRUD

- إنشاء قوائم متعددة (بقالة، خضار، صيدلية)
- إضافة/حذف أصناف

### 🔹 اليوم ٢٠ (الأحد): Realtime Sync

- استخدام Supabase Realtime
- اشتراك في تغييرات الأصناف
- UI يحدّث تلقائياً عند تغيير من جهاز آخر

### 🔹 اليوم ٢١ (الإثنين): Auto-Categorization

- تصنيف الأصناف تلقائياً (ألبان، خضروات، إلخ)
- قاموس عربي للمنتجات السعودية الشائعة
- ترتيب القائمة حسب تسلسل أقسام السوبرماركت

### 🔹 اليوم ٢٢ (الثلاثاء): Item History

- أرشيف الأصناف المُشتراة سابقاً
- "إعادة إضافة" بضغطة واحدة
- Suggestions بناءً على التكرار

### 🔹 اليوم ٢٣ (الأربعاء): Quick Add UI

- Voice input (اختياري)
- Bulk add (لصق قائمة كاملة)
- Quick add buttons للمشتريات الأسبوعية

### 🔹 اليوم ٢٤ (الخميس): اختبار + تحسين

- استخدام فعلي مع عائلتك ليوم كامل
- جمع ملاحظات + تحسينات سريعة

**Deliverable الأسبوع:** قائمة مشتريات تستخدمها فعلياً عائلتك

---

## 📅 الأسبوع ٥: الصيانة + Telegram Bot

> **الهدف:** تنبيهات ذكية تصل العائلة

### 🔹 اليوم ٢٥ (السبت): Appliances CRUD

- تسجيل أجهزة (مكيف، فلتر، سيارة، إلخ)
- معلومات الضمان والشراء

### 🔹 اليوم ٢٦ (الأحد): Maintenance Schedules

- جدولة صيانة دورية لكل جهاز
- حساب nextDueAt تلقائياً

### 🔹 اليوم ٢٧ (الإثنين): Maintenance History

- تسجيل صيانة منفّذة
- تكلفة + ملاحظات + مرفقات
- إعادة جدولة تلقائية

### 🔹 اليوم ٢٨ (الثلاثاء): Telegram Bot Setup

ملف `services/telegram-bot/`:

```python
# bot.py - aiogram-based
from aiogram import Bot, Dispatcher
from aiogram.types import Message

bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher()

@dp.message(Command("status"))
async def status_handler(message: Message):
    # Show today's chores, due bills
    ...

@dp.message(Command("done"))
async def done_handler(message: Message):
    # Mark a chore done from Telegram
    ...
```

### 🔹 اليوم ٢٩ (الأربعاء): Notifications Engine

ملف `lib/notifications/engine.ts`:

- Cron يومي صباحاً: يفحص المهام والفواتير القادمة
- يرسل لكل عضو عبر Telegram
- يدعم mute hours (ما يرسل بعد ١٠ مساءً)

### 🔹 اليوم ٣٠ (الخميس): Web Push (اختياري)

- Service Worker
- Push notifications للمتصفح
- اختياري للمستخدمين الذين لا يستخدمون Telegram

**Deliverable الأسبوع:** تنبيهات تصل لكل أفراد العائلة

---

## 📅 الأسبوع ٦: التحسين والإطلاق

### 🔹 اليوم ٣١ (السبت): Polish - Hijri Calendar

- عرض التواريخ بالهجري والميلادي
- المناسبات السعودية (رمضان، العيدين، اليوم الوطني)

### 🔹 اليوم ٣٢ (الأحد): Performance

- Lighthouse audit
- Image optimization
- Database indexing
- Caching strategy

### 🔹 اليوم ٣٣ (الإثنين): Mobile UX

- اختبار على أجهزة فعلية
- إصلاح أي مشاكل في الـ touch targets
- PWA manifest

### 🔹 اليوم ٣٤ (الثلاثاء): Backup + Monitoring

- نسخ احتياطي يومي للقاعدة
- Prometheus + Grafana (تستفيد من خبرتك)
- Health check endpoints

### 🔹 اليوم ٣٥ (الأربعاء): Family Onboarding

- إضافة عائلتك الفعلية
- جلسة "تدريب" قصيرة
- إعداد المهام والفواتير الحقيقية

### 🔹 اليوم ٣٦ (الخميس): الإطلاق + احتفال

- استخدام رسمي للنظام
- نشر تجربة على LinkedIn/Twitter
- جمع ملاحظات للأسبوع التالي

---

## 🛠️ مكدس البنية التحتية على Pi

```
Raspberry Pi 4 (192.168.100.64)
├── Docker
│   ├── postgres:16 (port 5432)
│   ├── baity-app:latest (port 3000)
│   ├── baity-bot:latest (Telegram bot)
│   ├── caddy:latest (reverse proxy)
│   ├── prometheus (موجود)
│   └── grafana (موجود)
├── Storage
│   ├── /home/pi/baity/db/        (PostgreSQL data)
│   ├── /home/pi/baity/uploads/   (Bill attachments)
│   └── /home/pi/baity/backups/   (Daily backups)
└── Domain
    └── baity.local / baity.tail-scale.ts (إذا تستخدم Tailscale)
```

---

## ⚠️ مخاطر محتملة + خطط بديلة

| المخاطرة | احتمالية | الخطة البديلة |
|----------|---------|--------------|
| Pi بطيء على Postgres | متوسطة | استخدم SQLite في البداية، انقل لـ Postgres لاحقاً |
| Realtime Sync معقّد | متوسطة | ابدأ بـ polling كل ٥ ثواني، طوّر لـ Realtime لاحقاً |
| Hijri date library issues | منخفضة | استخدم API: aladhan.com كـ fallback |
| Telegram Bot token | منخفضة | استخدم نفس البوت الموجود مع plugins |
| نسيت ميزة | عالية | اتركها للمرحلة ٢ — لا تعدّل خطة MVP |

---

## 📊 مؤشرات التقدم اليومية

كل يوم في `DEV_LOG.md`:
- ✅ ما أنجزته
- ⏳ ما تبقى
- 🐛 مشاكل واجهتها
- 💡 أفكار للمستقبل
- ⏰ الوقت المستغرق

---

## 🎁 ميزات لا تدخل MVP (مرحلة ٢)

محفوظة في `ROADMAP.md`:
- قراءة الفواتير من الإيميل (Postmark + Claude)
- OCR للفواتير المصوّرة
- المساعد الذكي (Claude/Ollama)
- Expense Splitting بين الأعضاء
- Meal Planning
- Expiry Tracker (مخزون الأدوية)
- تكامل SADAD
- iOS/Android native apps

---

## 🚀 الخطوة التالية الفورية

**اليوم (اليوم ١):** SSH إلى الـ Pi وابدأ الـ Setup:

```bash
ssh pi@192.168.100.64
cd ~/projects
mkdir baity && cd baity
npx create-next-app@latest .
```

ثم اتبع جدول اليوم ١ بالحرف.

**هل تبي أساعدك في:**
1. إعداد المشروع كاملاً (commands جاهزة للنسخ)؟
2. ملف `CLAUDE.md` تفصيلي للمشروع؟
3. Docker Compose للتطوير + الإنتاج؟
4. كل ذلك في حزمة واحدة؟
