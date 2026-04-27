# 🏗️ معمارية "بيتي" — المرجع الكامل

> **النسخة:** 1.0 | **آخر تحديث:** 2026-04-27
> هذا الملف يوثّق القرارات المعمارية الجوهرية. لا تغيّر شيئاً دون تحديثه.

---

## 1. نظرة عامة على النظام

```
┌─────────────────────────────────────────────────────────┐
│                    المستخدم (Browser / PWA)              │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────┐
│              Caddy (Reverse Proxy + TLS)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│           Next.js 16 App (Port 3000)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ App Router   │  │  REST API    │  │  Middleware   │  │
│  │ (RSC/SSR)    │  │  /api/v1/*   │  │  (i18n+Auth) │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└────────┬──────────────────────┬────────────────────────┘
         │                      │
┌────────▼──────┐    ┌──────────▼──────────────────────┐
│  PostgreSQL   │    │  Supabase (Auth + Storage)       │
│  (Prisma ORM) │    │  - Phone OTP                     │
│  Port 5432    │    │  - File buckets per household    │
└───────────────┘    └─────────────────────────────────┘
         │
┌────────▼──────┐    ┌─────────────────────────────────┐
│  Redis        │    │  Telegram Bot (Python aiogram)   │
│  (BullMQ)     │    │  - إشعارات الفواتير              │
│  Port 6379    │    │  - تحديثات المهام                │
└───────────────┘    └─────────────────────────────────┘
```

---

## 2. بنية المجلدات (Feature-Based Architecture)

### المبدأ
**ميزة جديدة = مجلد جديد في `features/`** — لا تعديل ملفات مبعثرة.

```
src/
├── app/                              # Next.js App Router
│   ├── [locale]/                     # كل الصفحات تحت locale
│   │   ├── layout.tsx                # Layout الجذر (lang, dir, fonts)
│   │   ├── (web)/                    # مجموعة صفحات الويب
│   │   │   ├── dashboard/
│   │   │   ├── bills/
│   │   │   ├── chores/
│   │   │   ├── shopping/
│   │   │   ├── appliances/
│   │   │   ├── archive/
│   │   │   └── wallet/              # اقتصاد البيت
│   │   └── page.tsx                 # Redirect → /ar/dashboard
│   └── api/v1/                      # REST API (للجوال مستقبلاً)
│       ├── bills/route.ts
│       ├── chores/route.ts
│       ├── auth/route.ts
│       └── household/route.ts
│
├── features/                         # ⭐ القلب — كل وحدة مستقلة
│   ├── bills/
│   │   ├── components/               # BillCard, BillForm, BillsList
│   │   ├── hooks/                    # useBills, useCreateBill
│   │   ├── api/                      # repository.ts (data access)
│   │   ├── lib/                      # pure functions (testable)
│   │   │   ├── period-calculator.ts
│   │   │   └── __tests__/
│   │   ├── schemas/                  # Zod schemas
│   │   └── types.ts
│   ├── chores/                       # مهام دورية (Grocy-inspired)
│   ├── shopping/                     # قوائم المشتريات
│   ├── appliances/                   # الأجهزة المنزلية
│   ├── warranty/                     # الضمانات + أرشيف الفواتير
│   ├── archive/                      # الأرشيف العام
│   ├── house-economy/                # اقتصاد البيت للأطفال
│   └── notifications/                # إدارة الإشعارات
│
├── shared/                           # مُستخدم في أكثر من feature
│   ├── ui/                           # shadcn components (Button, Card...)
│   ├── hooks/                        # useFormat, useAuth, useHousehold
│   ├── lib/                          # cn(), formatters, validators
│   └── types/                        # Global types
│
├── core/                             # Infrastructure — لا business logic هنا
│   ├── auth/                         # JWT, session, RBAC
│   ├── db/                           # Prisma client singleton
│   ├── storage/                      # Supabase Storage wrapper
│   ├── i18n/                         # format-number, format-date
│   ├── notifications/                # Telegram + Web Push abstraction
│   ├── native/                       # Capacitor abstractions (future)
│   └── config/                       # Feature flags, env validation
│
├── i18n/
│   ├── config.ts                     # locales, defaultLocale
│   ├── request.ts                    # next-intl server config
│   └── messages/
│       ├── ar.json                   # ⭐ المصدر الوحيد للنصوص
│       └── en.json                   # Placeholder (مستقبل)
│
└── server/
    ├── jobs/                         # Cron job definitions
    └── workers/                      # BullMQ workers
```

---

## 3. قرارات معمارية جوهرية (ADRs)

### ADR-001: Feature-Based Architecture
- **القرار:** كل ميزة مجلد مستقل في `features/`
- **السبب:** سهولة التوسع، عزل الميزات، سهولة التوظيف
- **البديل المرفوض:** Layer-based (components/, hooks/, api/ منفصلة)

### ADR-002: REST API + Server Components معاً
- **القرار:** Server Components للـ SSR + REST API /v1 للجوال مستقبلاً
- **السبب:** نفس الـ repository، مسارين مختلفين للوصول
- **التطبيق:** كل server action له endpoint مقابل في /api/v1

### ADR-003: Prisma + PostgreSQL
- **القرار:** Prisma ORM مع PostgreSQL 16
- **السبب:** Type-safe، migrations موثوقة، JSON support
- **مهم:** كل مبلغ مالي = `Decimal @db.Decimal(10,2)` — لا `Float`

### ADR-004: Multi-Tenancy عبر householdId
- **القرار:** كل جدول يحوي `householdId` — كل query يفلتر به
- **السبب:** عزل البيانات بين العائلات — جاهز لـ SaaS
- **الحماية:** `withHousehold()` helper + Supabase RLS

### ADR-005: i18n من اليوم الأول
- **القرار:** next-intl، كل نص من messages/ar.json
- **السبب:** إضافة لغة لاحقاً = 2-3 أيام بدلاً من 2-3 أشهر
- **الأرقام:** 0-9 فقط (الأرقام العربية الأصلية) — ممنوع ٠-٩ و ۰-۹

### ADR-006: Mobile-First + Capacitor-Ready
- **القرار:** Next.js + Native Abstractions Layer
- **السبب:** احتمال تحويل لجوال 20-50% — التكلفة يومان فقط
- **التطبيق:** core/native/ تُغلّف Camera, Storage, Notifications

---

## 4. تدفق البيانات (Data Flow)

```
المستخدم → Component → useQuery (TanStack) → API Route
                            ↓
                    Server Component → Repository
                            ↓
                    Prisma → PostgreSQL (مع householdId filter)
```

```
Mutation Flow:
المستخدم → Form (react-hook-form + Zod) → useMutation
              ↓ Optimistic Update (فوري)
         API Route → authenticate() → authorize() → Repository → DB
              ↓ Error → Rollback
         QueryClient.invalidate → Refetch
```

---

## 5. Authentication Flow

```
الوالد:
Phone OTP → Supabase Auth → JWT (access 15m + refresh 30d)
                          ↓
                    httpOnly Cookie (web) أو Bearer header (mobile)

الطفل:
اختيار الاسم → PIN 4 أرقام → bcrypt verify → JWT (24h)
```

---

## 6. Background Jobs Architecture

```
cron trigger (node-cron)
       ↓
BullMQ Queue (Redis-backed)
       ↓
Workers:
├── bill-recurrence.worker.ts    (ينشئ فواتير دورية)
├── chore-rollover.worker.ts     (يحرّك مواعيد المهام)
├── warranty-expiry.worker.ts    (تنبيه 30 يوم قبل)
└── notification-dispatch.worker.ts (Telegram + Push)
```

---

## 7. خطة التوسع

| المرحلة | البنية التحتية | المستخدمون |
|---------|----------------|-----------|
| الآن | Pi 4 + docker-compose | 1-20 |
| مرحلة 2 | Hetzner CAX11 + Caddy + S3 | 20-500 |
| مرحلة 3 | Kubernetes + Helm | 500+ |

**المفتاح:** الكود لا يتغيّر — فقط deployment config.

---

**آخر تحديث:** 2026-04-27 | **بواسطة:** Claude (Cowork)
