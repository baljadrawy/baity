# 🗓️ خطة تنفيذ "بيتي" — ٧ أسابيع للـ MVP (٤٨ يوم)

> الإصدار المحدّث: مع إضافة وحدة "اقتصاد البيت" للأطفال
> الفئة العمرية المستهدفة: ٤-١٢ سنة

---

## 🎯 رؤية المنتج المحدثة

> **"بيتي"** ليس مجرد تطبيق إدارة منزل — هو منصة تربوية تعلّم الجيل القادم قيمة العمل والمال، مع تنظيم شؤون البيت اليومية، بهوية عربية أصيلة.

### الأبعاد الثلاثة:
1. **التنظيم:** فواتير، مهام، مشتريات، صيانة
2. **التربية:** اقتصاد البيت + نقاط + ادخار + صدقة
3. **العائلة:** Multi-household + أدوار + تواصل عبر Telegram

---

## 📋 معايير النجاح المحدّثة

في نهاية ٧ أسابيع، يجب أن:

### للوالدين:
- ✅ تتبع ١٠+ فواتير شهرية مع تنبيهات
- ✅ توزيع ١٥+ مهمة دورية بعدالة آلية
- ✅ إدارة ١٠+ أعمال في منيو الأطفال
- ✅ موافقة/رفض أعمال مع صور قبل/بعد
- ✅ متابعة تقرير مالي شهري لكل طفل

### للأطفال (٤-١٢ سنة):
- ✅ تصفّح المنيو واختيار عمل مناسب لعمرهم
- ✅ بدء وإنهاء عمل مع رفع صور
- ✅ متابعة محفظتهم ورصيدهم
- ✅ تحديد هدف ادخار والتقدّم نحوه
- ✅ تقسيم تلقائي بين صرف/ادخار/صدقة

### للنظام:
- ✅ يعمل بثبات أسبوعين بدون تدخل
- ✅ تنبيهات Telegram تصل في وقتها
- ✅ نسخ احتياطي يومي

### لإدارة الممتلكات (وحدة الضمانات):
- ✅ تسجيل ١٥+ جهاز منزلي مع فواتيرهم
- ✅ ٩٠٪+ من الأجهزة عندها فاتورة شراء مرفوعة
- ✅ تنبيه قبل ٣٠ يوم من انتهاء الضمان
- ✅ بحث في فواتير الأرشيف بـ OCR (عربي/إنجليزي)

---

## 🏛️ المبادئ المعمارية الأساسية (تُطبّق من اليوم الأول)

> هذه المبادئ ليست "إضافات لاحقة" — هي قرارات معمارية يجب أن تُؤسَّس في الأسبوع ١، لأن إضافتها بعد بناء عشرات الميزات تكلفة عالية جداً.

---

### 1️⃣ التدويل (i18n) — جاهزية اللغات من البداية

**الفلسفة:** صحيح أن "بيتي" يُطلق بالعربية فقط، لكن **كل نص ظاهر للمستخدم يأتي من ملف ترجمة**، ليس من JSX مباشرة. هذا يجعل إضافة الإنجليزية أو الأوردو لاحقاً تستغرق ٢-٣ أيام بدلاً من ٢-٣ أشهر.

**المكتبة المختارة:** `next-intl` (الأنسب لـ Next.js 15 App Router)

```bash
npm install next-intl
```

**هيكل الملفات:**
```
src/
├── i18n/
│   ├── config.ts                # locales المدعومة + الافتراضي
│   ├── request.ts               # next-intl request config
│   └── messages/
│       ├── ar.json              # الترجمة العربية (الأساسية)
│       ├── en.json              # إنجليزي (للمستقبل)
│       └── ur.json              # أوردو (احتمال — للعمالة المنزلية)
├── middleware.ts                # locale detection
└── app/
    └── [locale]/                # كل الصفحات تحت locale dynamic segment
        ├── layout.tsx
        ├── dashboard/
        ├── bills/
        └── ...
```

**ملف `i18n/config.ts`:**
```typescript
export const locales = ['ar', 'en'] as const;
export const defaultLocale = 'ar' as const;
export type Locale = typeof locales[number];

export const localeConfig = {
  ar: {
    name: 'العربية',
    dir: 'rtl',
    flag: '🇸🇦',
    dateFormat: 'hijri-gregorian',
    numberFormat: 'arabic',         // 0123456789 — الأرقام العربية الأصلية (إجباري)
    fontFamily: 'IBM Plex Sans Arabic, Amiri',
    forbidIndicDigits: true         // قرار صلب: ممنوع منعاً باتاً ٠١٢٣٤٥٦٧٨٩
  },
  en: {
    name: 'English',
    dir: 'ltr',
    flag: '🇬🇧',
    dateFormat: 'gregorian',
    numberFormat: 'arabic',         // 0123456789
    fontFamily: 'Inter, system-ui',
    forbidIndicDigits: true
  }
} as const;
```

**هيكل ملف الترجمة (`messages/ar.json`):**
```json
{
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "loading": "جاري التحميل...",
    "currency": "ر.س"
  },
  "navigation": {
    "dashboard": "لوحة التحكم",
    "bills": "الفواتير",
    "chores": "المهام",
    "shopping": "المشتريات",
    "appliances": "الأجهزة",
    "archive": "الأرشيف",
    "wallet": "المحفظة"
  },
  "bills": {
    "title": "إدارة الفواتير",
    "add": "إضافة فاتورة",
    "dueIn": "تستحق خلال {days} يوم",
    "amount": "{amount} ر.س",
    "providers": {
      "stc": "STC",
      "sec": "الكهرباء",
      "mobily": "موبايلي",
      "zain": "زين",
      "nwc": "المياه الوطنية"
    },
    "status": {
      "pending": "قيد الانتظار",
      "due": "مستحقة",
      "paid": "مدفوعة",
      "overdue": "متأخرة"
    }
  },
  "chores": {
    "title": "المهام الدورية",
    "periodTypes": {
      "manually": "يدوي",
      "daily": "يومي",
      "dynamic_regular": "ديناميكي",
      "weekly": "أسبوعي",
      "monthly": "شهري",
      "yearly": "سنوي"
    },
    "assignmentTypes": {
      "no_assignment": "بدون إسناد",
      "who_least_did_it_first": "للأقل تنفيذاً",
      "random": "عشوائي",
      "in_alphabetic_order": "بالترتيب الأبجدي",
      "fixed": "ثابت"
    }
  },
  "wallet": {
    "balance": "الرصيد",
    "earned": "كسبت",
    "saved": "ادخرت",
    "charity": "تصدّقت",
    "spent": "صرفت",
    "goal": "هدفك",
    "remaining": "باقي {amount} ر.س"
  },
  "warranty": {
    "validUntil": "ساري حتى {date}",
    "expiresIn": "ينتهي خلال {days} يوم",
    "expired": "انتهى",
    "documents": "المستندات ({count})",
    "documentTypes": {
      "purchase_invoice": "فاتورة الشراء",
      "warranty_card": "كرت الضمان",
      "user_manual": "دليل المستخدم",
      "receipt": "إيصال",
      "service_report": "تقرير صيانة",
      "product_photo": "صورة المنتج"
    }
  },
  "errors": {
    "required": "هذا الحقل مطلوب",
    "invalidPhone": "رقم جوال غير صحيح",
    "fileTooLarge": "حجم الملف يتجاوز {max} ميجا",
    "networkError": "خطأ في الاتصال — حاول مرة أخرى"
  }
}
```

**قاعدة الذهب:** أي نص في الكود يجب أن يكون عبر `useTranslations()`:
```tsx
// ❌ خطأ — نص مباشر
<button>حفظ</button>

// ✅ صح — من ملف الترجمة
const t = useTranslations('common');
<button>{t('save')}</button>
```

**Linter rule لمنع المخالفات:**
- ESLint plugin: `eslint-plugin-formatjs` أو rule مخصصة
- Pre-commit hook يرفض أي PR فيه نصوص عربية في JSX مباشرة

**التواريخ والأرقام:**
- `next-intl` يدعم formatNumber, formatDateTime تلقائياً
- استخدام `Intl.NumberFormat('ar-SA')` للأرقام العربية الهندية
- التقويم الهجري عبر `date-fns-jalali` مع wrapper مخصص

**RTL/LTR:**
- `dir` يُضبط ديناميكياً في `<html dir={localeConfig[locale].dir}>`
- Tailwind logical properties: `ms-4` بدلاً من `ml-4`، `pe-2` بدلاً من `pr-2`

---

#### 🔢 قاعدة الأرقام العربية (إجبارية في كل الواجهة)

**توضيح المصطلحات (قرار المشروع):**

| الشكل | الاسم في "بيتي" | الحالة | Unicode |
|------|-----------------|--------|---------|
| **0 1 2 3 4 5 6 7 8 9** | الأرقام العربية ✅ | مسموحة (الافتراضية الوحيدة) | U+0030 – U+0039 |
| **٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩** | الأرقام الهندية ❌ | ممنوعة منعاً باتاً | U+0660 – U+0669 |
| **۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹** | الأرقام الفارسية ❌ | ممنوعة منعاً باتاً | U+06F0 – U+06F9 |

**القرار الصلب:** في كل واجهات "بيتي" — عربية أو إنجليزية — تظهر الأرقام بالشكل **0 1 2 3 4 5 6 7 8 9** فقط. الأرقام الهندية (٠١٢٣٤٥٦٧٨٩) ممنوعة في:
- الأسعار والمبالغ
- التواريخ (هجرية وميلادية)
- أرقام الجوال
- أرقام الفواتير والطلبات
- التقارير والـ PDFs
- إشعارات Telegram
- حقول الإدخال
- الـ tooltips والـ alerts

##### الطبقة الأولى: CSS — منع متصفّح iOS/Safari من التحويل التلقائي

بعض المتصفحات (خصوصاً Safari على iOS) تحوّل الأرقام تلقائياً للهندية عند رؤية `lang="ar"`. نمنع هذا السلوك بالـ CSS:

```css
/* src/app/globals.css */

/* 1. منع locale-aware glyph substitution على مستوى الخط */
* {
  font-feature-settings: "lnum" on,    /* lining numerals */
                         "tnum" on;    /* tabular numerals */
  font-variant-numeric: lining-nums tabular-nums;
}

/* 2. إجبار الأرقام في كل العناصر — حتى لو lang="ar" */
html, body, * {
  -webkit-locale: "en";   /* WebKit/Safari: استخدم الأرقام العربية */
}

/* 3. للخطوط التي قد تستبدل تلقائياً — أجبر عرض الـ glyphs الأصلية */
[lang], [lang] * {
  font-variant-numeric: lining-nums;
  font-feature-settings: "lnum" 1;
}

/* 4. ضمان إضافي: استخدم unicode-bidi لمنع تحويل الـ context */
.numeric, [data-numeric] {
  unicode-bidi: embed;
  direction: ltr;        /* الأرقام دائماً من اليسار لليمين */
}
```

##### الطبقة الثانية: HTML `lang` بـ Unicode Extension

المفتاح: نضيف `-u-nu-latn` في الـ `lang` attribute لإجبار **Latin numerals** (وهي الأرقام العربية الأصلية):

```tsx
// src/app/[locale]/layout.tsx
export default function LocaleLayout({ children, params: { locale } }) {
  // -u-nu-latn = Unicode extension يجبر الأرقام العربية الأصلية
  const lang = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';

  return (
    <html
      lang={lang}
      dir={localeConfig[locale].dir}
    >
      <body>{children}</body>
    </html>
  );
}
```

**مهم:** Unicode locale extension `nu-latn` يطلب من الـ ICU استخدام النظام الرقمي اللاتيني (= العربي الأصلي = 0123456789). هذا حاسم لأن `ar-SA` بدون extension يفترض الأرقام الهندية افتراضياً في بعض المنصات.

##### الطبقة الثالثة: JavaScript — `Intl.NumberFormat` بـ `numberingSystem: 'latn'`

أي عدد يُعرض يمر عبر helper موحّد يجبر `latn`:

```typescript
// src/core/i18n/format-number.ts

/**
 * الدالة الموحّدة لتنسيق أي رقم في "بيتي".
 * تجبر الأرقام العربية (0-9) في كل الـ locales.
 * استخدامها إجباري — ESLint يرفض الأرقام الحرفية في JSX.
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  const baseLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(baseLocale, {
    numberingSystem: 'latn',  // ⭐ يجبر 0-9 الأرقام العربية الأصلية
    ...options
  }).format(value);
}

export function formatCurrency(
  value: number,
  locale: Locale,
  currency = 'SAR'
): string {
  return formatNumber(value, locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol'
  });
  // النتيجة العربية: 20.50 ر.س
  // النتيجة الإنجليزية: SAR 20.50
}

export function formatDate(date: Date, locale: Locale): string {
  if (locale === 'ar') {
    return new Intl.DateTimeFormat('ar-SA', {
      numberingSystem: 'latn',     // ⭐ أرقام عربية حتى في التاريخ الهجري
      calendar: 'gregory',          // أو 'islamic-umalqura' للهجري
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
    // النتيجة: 26 أبريل 2026
  }
  return new Intl.DateTimeFormat('en-US').format(date);
}

export function formatHijriDate(date: Date, locale: Locale = 'ar'): string {
  return new Intl.DateTimeFormat('ar-SA', {
    numberingSystem: 'latn',         // ⭐ مهم: حتى الهجري بأرقام عربية
    calendar: 'islamic-umalqura',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
  // النتيجة: 9 شوال 1447
}

export function formatPhoneNumber(phone: string, _locale: Locale): string {
  // 0501234567 → 050 123 4567 (دائماً أرقام عربية)
  const normalized = convertToArabicDigits(phone);
  return normalized.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

/**
 * تحويل أي أرقام (هندية U+0660-U+0669، فارسية U+06F0-U+06F9)
 * إلى الأرقام العربية الأصلية (0-9).
 * تُستخدم على كل input وارد + أي بيانات خارجية.
 */
export function convertToArabicDigits(text: string): string {
  return text
    // الهندية → عربية
    .replace(/[٠-٩]/g, (d) =>
      String(d.charCodeAt(0) - 0x0660))
    // الفارسية → عربية
    .replace(/[۰-۹]/g, (d) =>
      String(d.charCodeAt(0) - 0x06F0));
}

/**
 * فحص: هل النص يحوي أرقاماً ممنوعة (هندية أو فارسية)؟
 * يُستخدم في validators لرفض البيانات الملوّثة.
 */
export function containsForbiddenDigits(text: string): boolean {
  return /[٠-٩۰-۹]/.test(text);
}
```

##### الطبقة الرابعة: React Hook موحّد

```typescript
// src/shared/hooks/useFormat.ts
import { useLocale } from 'next-intl';
import * as fmt from '@/core/i18n/format-number';

export function useFormat() {
  const locale = useLocale() as Locale;
  return {
    number: (v: number, opts?: Intl.NumberFormatOptions) =>
      fmt.formatNumber(v, locale, opts),
    currency: (v: number) => fmt.formatCurrency(v, locale),
    date: (d: Date) => fmt.formatDate(d, locale),
    hijri: (d: Date) => fmt.formatHijriDate(d, locale),
    phone: (p: string) => fmt.formatPhoneNumber(p, locale),
  };
}

// الاستخدام:
function BillCard({ bill }: { bill: Bill }) {
  const f = useFormat();
  return (
    <div>
      <span>{f.currency(bill.amount)}</span>     {/* 20.50 ر.س */}
      <span>{f.date(bill.dueDate)}</span>        {/* 26 أبريل 2026 */}
      <span>{f.hijri(bill.dueDate)}</span>       {/* 9 شوال 1447 */}
    </div>
  );
}
```

##### الطبقة الخامسة: ESLint — منع الأرقام الهندية في الكود

قاعدة custom تمنع المطوّرين من كتابة أرقام هندية في أي مكان:

```javascript
// .eslintrc.json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/[٠-٩۰-۹]/]",
        "message": "❌ ممنوع: الأرقام الهندية/الفارسية ممنوعة في الكود. استخدم 0-9 فقط."
      },
      {
        "selector": "TemplateElement[value.raw=/[٠-٩۰-۹]/]",
        "message": "❌ ممنوع: الأرقام الهندية/الفارسية ممنوعة في template strings."
      }
    ]
  }
}
```

**Pre-commit hook إضافي** يفحص ملفات الترجمة:

```bash
#!/bin/bash
# .husky/pre-commit
# منع الأرقام الهندية في ملفات الترجمة JSON

if grep -rP '[\x{0660}-\x{0669}\x{06F0}-\x{06F9}]' src/i18n/messages/; then
  echo "❌ تم العثور على أرقام هندية/فارسية في ملفات الترجمة"
  echo "   استخدم 0-9 فقط (الأرقام العربية الأصلية)"
  exit 1
fi
```

##### الطبقة السادسة: حقول الإدخال — تحويل تلقائي

المستخدم قد يلصق نصاً فيه أرقام هندية، أو يكتب من لوحة مفاتيح عربية. الـ Input component يحوّل تلقائياً:

```tsx
// src/shared/ui/NumberInput.tsx
'use client';
import { useLocale } from 'next-intl';
import { convertToArabicDigits } from '@/core/i18n/format-number';

export function NumberInput({ value, onChange, ...props }) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // ١. حوّل أي أرقام هندية/فارسية لعربية فوراً
    const cleaned = convertToArabicDigits(e.target.value);
    // ٢. تحقق أنه رقم صحيح (الأرقام العربية فقط)
    if (!/^\d*\.?\d*$/.test(cleaned)) return;
    // ٣. مرّر القيمة النظيفة
    onChange(cleaned);
  };

  return (
    <input
      type="text"          // ليس "number" — للتحكم الكامل
      inputMode="decimal"  // لوحة المفاتيح الرقمية على الجوال
      lang="en"            // ⭐ يمنع المتصفح من فرض الهندية
      value={value}
      onChange={handleChange}
      style={{
        fontVariantNumeric: 'tabular-nums lining-nums',
        direction: 'ltr',  // الأرقام LTR حتى في RTL
        textAlign: 'start'
      }}
      {...props}
    />
  );
}
```

**ملاحظات حرجة:**
1. `lang="en"` على الـ input ضروري لمنع iOS Safari من تحويل الأرقام للهندية تلقائياً.
2. `<input type="number">` يتجاهل بعض إعدادات اللغة، لذلك نستخدم `type="text"` + `inputMode="decimal"`.
3. `direction: ltr` على الأرقام لأن الأرقام دائماً تُكتب من اليسار لليمين حتى في النصوص العربية.

##### الطبقة السابعة: قاعدة البيانات

نخزّن دائماً أرقام عربية أصلية (0-9) في DB. التحقق على مستوى Zod:

```typescript
// src/shared/schemas/digits.ts
import { z } from 'zod';
import { containsForbiddenDigits, convertToArabicDigits } from '@/core/i18n/format-number';

/**
 * String schema يرفض الأرقام الهندية ويحوّلها تلقائياً إذا أمكن.
 */
export const safeString = z.string().transform((val, ctx) => {
  if (containsForbiddenDigits(val)) {
    // الخيار 1: تحويل تلقائي (transparent)
    return convertToArabicDigits(val);

    // أو الخيار 2: رفض صارم
    // ctx.addIssue({ code: 'custom', message: 'ممنوع استخدام الأرقام الهندية' });
    // return z.NEVER;
  }
  return val;
});

// كل API route يستخدمها
const createBillSchema = z.object({
  title: safeString.min(1).max(200),
  amount: z.number().positive(),
  notes: safeString.optional()
});
```

##### الطبقة الثامنة: Telegram Bot والإشعارات

كل القوالب مكتوبة بأرقام عربية، والقيم الديناميكية تمر عبر `formatNumber` التي تجبر `latn`:

```typescript
// core/notifications/templates/ar.ts
export const billDueTemplate = (data: BillData) => `
🔔 تنبيه فاتورة

📄 ${data.title}
💰 المبلغ: ${formatCurrency(data.amount, 'ar')}
📅 تستحق: ${formatDate(data.dueDate, 'ar')}
⏰ خلال ${formatNumber(data.daysLeft, 'ar')} يوم
`;
// النتيجة:
// 🔔 تنبيه فاتورة
// 📄 فاتورة الكهرباء
// 💰 المبلغ: 350.00 ر.س
// 📅 تستحق: 30 أبريل 2026
// ⏰ خلال 4 يوم
```

##### الطبقة التاسعة: PDFs والتقارير

تقارير الأطفال والفواتير تستخدم نفس formatters:

```typescript
// features/house-economy/lib/monthly-report.ts
const report = `
شهر ${formatHijriDate(monthStart, 'ar')} — تقرير ${child.name}

✅ الأعمال المنجزة: ${f.number(jobsCount)}
💰 إجمالي الكسب: ${f.currency(totalEarned)}
💎 المبلغ المدّخر: ${f.currency(totalSaved)}
🏆 المركز: ${f.number(rank)} من ${f.number(totalChildren)}
`;
// كله بأرقام عربية أصلية تلقائياً
```

##### اختبارات التحقق

```typescript
// src/core/i18n/__tests__/format-number.test.ts
describe('قاعدة الأرقام العربية', () => {
  it('يستخدم الأرقام العربية الأصلية في ar locale', () => {
    expect(formatNumber(2026, 'ar')).toBe('2,026');
    expect(formatCurrency(150.5, 'ar')).toMatch(/150\.50/);
  });

  it('لا يُخرج أبداً أرقاماً هندية', () => {
    const result = formatCurrency(2026, 'ar');
    expect(result).not.toMatch(/[٠-٩]/); // لا أرقام هندية
    expect(result).not.toMatch(/[۰-۹]/); // لا أرقام فارسية
  });

  it('يحوّل الأرقام الهندية الواردة لعربية', () => {
    expect(convertToArabicDigits('فاتورة ١٢٣٤')).toBe('فاتورة 1234');
    expect(convertToArabicDigits('Order #١٢٣٤')).toBe('Order #1234');
  });

  it('يحوّل الأرقام الفارسية لعربية', () => {
    expect(convertToArabicDigits('۱۲۳۴۵')).toBe('12345');
  });

  it('يكتشف الأرقام الممنوعة', () => {
    expect(containsForbiddenDigits('hello 123')).toBe(false);
    expect(containsForbiddenDigits('hello ١٢٣')).toBe(true);
    expect(containsForbiddenDigits('hello ۱۲۳')).toBe(true);
  });

  it('التواريخ الهجرية بأرقام عربية', () => {
    const date = new Date('2026-04-26');
    const result = formatHijriDate(date, 'ar');
    expect(result).toMatch(/[0-9]/);            // فيها أرقام عربية
    expect(result).not.toMatch(/[٠-٩]/); // لا هندية
  });
});
```

**E2E test — قاعدة صفر هندية في كل التطبيق:**
```typescript
// e2e/digits.spec.ts
test('لا توجد أرقام هندية في أي مكان من التطبيق', async ({ page }) => {
  const pages = ['/ar/dashboard', '/ar/bills', '/ar/chores',
                 '/ar/wallet', '/ar/appliances', '/ar/archive'];

  for (const url of pages) {
    await page.goto(url);
    const html = await page.content();

    // قاعدة صارمة: صفر أرقام هندية أو فارسية في أي صفحة
    expect(html).not.toMatch(/[٠-٩]/);
    expect(html).not.toMatch(/[۰-۹]/);
  }
});

test('input يحوّل الأرقام الهندية تلقائياً', async ({ page }) => {
  await page.goto('/ar/bills/new');
  await page.fill('[name="amount"]', '١٢٣');     // المستخدم لصق هندية
  await expect(page.locator('[name="amount"]')).toHaveValue('123');  // محوّلة
});
```

##### ملخّص الطبقات (دفاع متعدد ١٠ طبقات)

| # | الطبقة | الأداة | الغرض |
|---|--------|--------|------|
| 1 | CSS | `font-variant-numeric: lining-nums` + `-webkit-locale: en` | منع المتصفح من التحويل |
| 2 | HTML | `lang="ar-SA-u-nu-latn"` | إجبار Latin numerals عبر Unicode extension |
| 3 | JS Format | `Intl.NumberFormat({ numberingSystem: 'latn' })` | الإجبار البرمجي |
| 4 | React Hook | `useFormat()` موحّد | API نظيف للمطوّرين |
| 5 | ESLint | منع `٠-٩` و `۰-۹` في الكود | حماية وقت التطوير |
| 6 | Pre-commit | فحص ملفات JSON والترجمات | حماية وقت الكوميت |
| 7 | Inputs | تحويل تلقائي عند الإدخال | تنظيف بيانات المستخدم |
| 8 | Zod schemas | `safeString` يرفض/يحوّل | تنظيف على مستوى API |
| 9 | DB | تخزين 0-9 فقط دائماً | البيانات نظيفة |
| 10 | Tests | Unit + E2E + visual regression | ضمان عدم التراجع |

**النتيجة المضمونة:**
- صفر أرقام هندية (٠١٢٣٤٥٦٧٨٩) أو فارسية (۰۱۲۳۴۵۶۷۸۹) في أي مكان.
- كل الأرقام بالشكل **0 1 2 3 4 5 6 7 8 9** (الأرقام العربية الأصلية) في:
  - الواجهة العربية والإنجليزية
  - التواريخ الهجرية والميلادية
  - الإشعارات والـ PDFs
  - حقول الإدخال (تحويل تلقائي)
  - قاعدة البيانات

أي مطوّر يحاول كتابة `<span>المبلغ ١٥٠</span>`، ESLint يرفض الـ commit. أي مستخدم يلصق `١٢٣`، الـ input يحوّلها لـ `123` فوراً. أي بيانات قديمة فيها هندية، Zod ينظّفها قبل الحفظ.

---

### 2️⃣ الأمن — مبني من الأساس (Security by Design)

**الفلسفة:** "بيتي" يحفظ بيانات حساسة (فواتير، صور أطفال، أرقام جوّال، وثائق هوية في الأرشيف). الأمن ليس feature بل أساس البناء.

#### أ) إدارة الأسرار (Secrets Management)
```bash
# ❌ ممنوع منعاً باتاً
DATABASE_URL=postgresql://user:password@host/db  # في الكود

# ✅ صح
.env.local              # مستبعد من Git (في .gitignore)
.env.local.example      # في Git، بدون قيم حقيقية
docker secrets          # للإنتاج على Pi
```

**أداة:** `dotenv-vault` أو `infisical` للفريق لاحقاً.

#### ب) Authentication & Session
- **Phone OTP عبر Supabase Auth** (لا كلمات مرور أبداً للوالدين)
- **PIN ٤ أرقام للأطفال** — مع `bcrypt` hashing وعدد محاولات محدود (٥ محاولات → قفل ١٥ دقيقة)
- **JWT في httpOnly cookies** — لا localStorage أبداً
- **Session expiry:** ٧ أيام للوالد، ٢٤ ساعة للطفل
- **Refresh token rotation:** كل refresh ينتج token جديد ويُلغي القديم

#### ج) Authorization (RBAC + Row-Level Security)

**قاعدة:** كل query يجب أن يفلتر بـ `householdId` الذي ينتمي له المستخدم.

**Middleware عام:**
```typescript
// lib/auth/with-household.ts
export async function withHousehold<T>(
  userId: string,
  householdId: string,
  fn: (membership: HouseholdMember) => Promise<T>
): Promise<T> {
  const membership = await prisma.householdMember.findUnique({
    where: { userId_householdId: { userId, householdId } }
  });

  if (!membership) {
    throw new ForbiddenError('not a member of this household');
  }
  return fn(membership);
}

// كل API route يستخدمها
export async function GET(req: Request) {
  const session = await getSession(req);
  return withHousehold(session.userId, params.householdId, async (m) => {
    // ... الكود هنا مضمون أن المستخدم عضو
  });
}
```

**Supabase RLS (طبقة ثانية):**
```sql
-- على مستوى Postgres — لا يمكن تجاوزها حتى لو فيه bug في الكود
CREATE POLICY "members_only" ON bills
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );
```

#### د) Input Validation (Zod everywhere)
```typescript
// schemas/bill.ts
export const createBillSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive().max(1_000_000),
  dueDate: z.coerce.date().min(new Date('2020-01-01')),
  category: z.enum(['electricity', 'telecom', 'water', 'subscription']),
  attachmentUrl: z.string().url().optional()
});

// كل API route يبدأ بـ:
const data = createBillSchema.parse(await req.json());
```

#### هـ) رفع الملفات (مهم جداً للضمانات)
- **حد أقصى:** ٢٠ ميجا للملف
- **MIME whitelist:** `image/jpeg, image/png, image/webp, application/pdf`
- **Magic byte check** — التحقق من نوع الملف الفعلي وليس الـ extension فقط
- **Virus scan:** `clamav` على Pi (free, open source)
- **EXIF stripping** للصور — حذف بيانات الموقع الجغرافي تلقائياً (مهم لصور الأطفال!)
- **Bucket isolation:** كل بيت في bucket منفصل: `households/{householdId}/...`
- **Signed URLs:** لا روابط دائمة — كل وصول يولّد signed URL بصلاحية ساعة

#### و) حماية بيانات الأطفال (PII)
- **العمر يُستخدم لكن لا يُعرض** للأطفال أنفسهم (لمنع المقارنات)
- **صور الأطفال:** مخزّنة في bucket مغلق + signed URLs قصيرة العمر
- **مسح EXIF** إجباري قبل الحفظ
- **Audit log منفصل** لكل وصول لبيانات الأطفال
- **Right to delete:** عند حذف عضو، تُحذف كل بياناته (cascade)

#### ز) Rate Limiting
```typescript
// upstash/ratelimit أو middleware مخصص
- /api/auth/login         → ٥ محاولات/دقيقة/IP
- /api/upload             → ٢٠ ملف/ساعة/مستخدم
- /api/jobs/start         → ١٠ بدء/دقيقة/طفل (منع spam)
- general API             → ١٠٠ req/دقيقة/مستخدم
```

#### ح) Logging & Monitoring
- **لا تسجّل بيانات حساسة:** أرقام جوّال، أرقام حسابات، صور
- **Audit log منفصل** لـ:
  - تسجيل دخول/خروج
  - حذف بيانات
  - موافقة الوالد على عمل طفل
  - أي تعديل على wallet
- **Sentry للأخطاء** — مع PII scrubbing

#### ط) Backups & Encryption
- **النسخ الاحتياطي:** يومي، مشفّر بـ `age` أو `gpg`
- **At-rest encryption:** Postgres مع pgcrypto للحقول الحساسة
- **In-transit:** TLS فقط (Caddy auto-renews)
- **اختبار الاستعادة:** شهرياً (نسخة احتياطية لا تعمل = لا نسخة)

#### ي) Dependencies
- `npm audit` في CI — يفشل البناء على critical vulnerabilities
- **Snyk** أو **Dependabot** للـ auto PRs
- **Lock files** ملتزم بها دائماً

---

### 3️⃣ قابلية التوسع والتطوير (Scalability & Maintainability)

**الفلسفة:** نبدأ صغيراً (عائلة واحدة على Pi)، لكن الكود يجب أن يكون قابلاً للنقل لـ ١٠٠٠ عائلة على Hetzner دون إعادة كتابة.

#### أ) هيكل المجلدات (Feature-Based, ليس Layer-Based)

```
src/
├── app/                          # Next.js routes فقط
│   └── [locale]/...
├── features/                     # كل وحدة مستقلة
│   ├── bills/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/                  # server actions / route handlers
│   │   ├── lib/                  # business logic pure functions
│   │   ├── schemas/              # Zod schemas
│   │   └── types.ts
│   ├── chores/
│   ├── shopping/
│   ├── appliances/
│   ├── warranty/
│   ├── archive/
│   ├── house-economy/            # اقتصاد البيت — وحدة كاملة
│   └── notifications/
├── shared/                       # المُستخدم في أكثر من feature
│   ├── ui/                       # shadcn components
│   ├── hooks/
│   ├── lib/
│   └── types/
├── core/                         # infrastructure
│   ├── auth/
│   ├── db/                       # prisma client
│   ├── storage/                  # supabase storage wrapper
│   ├── i18n/
│   ├── notifications/            # telegram + web push abstraction
│   └── config/
└── server/
    ├── jobs/                     # cron tasks
    └── workers/
```

**القاعدة:** أي ميزة جديدة = مجلد جديد في `features/`. لو الميزة كبرت أكثر من اللازم → تنفصل لـ microservice لاحقاً بسهولة.

#### ب) فصل الـ Business Logic عن الـ UI

**مثال — منطق المهام:**
```typescript
// ❌ خطأ — منطق في الـ component
function ChoresList() {
  const next = chores.map(c => {
    if (c.periodType === 'DYNAMIC_REGULAR') {
      return addDays(c.lastExecutedAt, c.periodDays);
    }
    // ... ١٥ سطر منطق
  });
}

// ✅ صح — منطق في pure function قابل للاختبار
// features/chores/lib/period-engine.ts
export function calculateNextDueDate(chore: Chore, last: Date | null): Date | null {
  // ...
}

// features/chores/lib/__tests__/period-engine.test.ts
describe('calculateNextDueDate', () => { /* ... */ });

// في الـ component
const next = calculateNextDueDate(chore, chore.lastExecutedAt);
```

#### ج) طبقة Data Access موحّدة

```typescript
// features/bills/api/repository.ts
export class BillsRepository {
  constructor(private db: PrismaClient, private householdId: string) {}

  async list(filters?: BillFilters) { /* ... */ }
  async create(data: CreateBillInput) { /* ... */ }
  async pay(billId: string, amount: number) { /* ... */ }
}

// الفائدة: لو غيرنا من Prisma لـ Drizzle لاحقاً، نغيّر الـ repository فقط
```

#### د) Background Jobs Architecture
```typescript
// core/jobs/
├── queue.ts              // BullMQ wrapper (Redis-backed)
├── scheduler.ts          // cron registration
└── workers/
    ├── bill-recurrence.worker.ts
    ├── chore-rollover.worker.ts
    ├── warranty-expiry.worker.ts
    └── notification-dispatch.worker.ts

// كل worker مستقل — لو واحد فشل، الباقي يستمر
// لو احتجنا scale، ننقل workers لـ container منفصل
```

#### هـ) API Versioning
```
/api/v1/bills
/api/v1/chores
```
حتى لو ما نحتاجه الآن، إضافته كلفة صفر، لكن إضافته لاحقاً = كسر كل clients.

#### و) Feature Flags من اليوم الأول
```typescript
// core/config/features.ts
export const features = {
  houseEconomy: env('FEATURE_HOUSE_ECONOMY', true),
  warrantyOcr: env('FEATURE_WARRANTY_OCR', true),
  telegramBot: env('FEATURE_TELEGRAM', true),
  charityIntegration: env('FEATURE_CHARITY', false),  // مرحلة ٢
  familyBank: env('FEATURE_FAMILY_BANK', false),       // مرحلة ٣
} as const;

// في الـ component
{features.houseEconomy && <ChildWalletWidget />}
```

#### ز) Database Design للتوسع
- **UUID/CUID فقط** — لا auto-increment integers (مشاكل عند الـ sharding)
- **Soft deletes** — `deletedAt` بدل `DELETE` (للتدقيق والاستعادة)
- **createdAt + updatedAt** على كل جدول
- **Indexes من البداية** على الأعمدة المُستخدمة في WHERE/JOIN
- **Connection pooling** عبر `pgbouncer` أو Prisma Data Proxy
- **Migrations منفصلة** عن seeds — Prisma migrate + ts-node seed scripts

#### ح) Caching Strategy
```typescript
// shared/lib/cache.ts
- L1: React Query (client-side, 5 دقائق)
- L2: Next.js Cache (server-side, revalidate)
- L3: Redis (لاحقاً عند الحاجة) — للقوائم الثقيلة
```

#### ط) Testing Pyramid
```
  E2E (Playwright)         ← ٥٪ — flows أساسية فقط
   Integration (Vitest)    ← ١٥٪ — API routes + repos
    Unit (Vitest)          ← ٨٠٪ — pure functions, logic
```
**Coverage gate:** ٧٠٪+ على `features/*/lib/` (المنطق الجوهري).

#### ي) CI/CD
```yaml
# .github/workflows/ci.yml
- typecheck         # tsc --noEmit
- lint              # eslint + prettier check
- test              # vitest
- build             # next build
- security          # npm audit + snyk
- e2e               # playwright (smoke tests)
```

#### ك) Observability
- **Logs:** structured JSON (pino) — قابل للبحث
- **Metrics:** Prometheus (لديك بالفعل!) — request rates, errors, latencies
- **Traces:** OpenTelemetry (يضاف عند ال scale)
- **Health checks:** `/api/health` و `/api/ready` (Kubernetes-ready من اليوم الأول)

#### ل) خطة الترحيل من Pi لـ Hetzner
```
المرحلة ١: Pi 4 (الآن — ٤-٢٠ مستخدم)
   ↓ كل شيء في docker-compose
المرحلة ٢: Hetzner CAX11 (٢٠-٥٠٠ مستخدم)
   ↓ نفس docker-compose، نضيف Caddy + S3 storage
المرحلة ٣: Kubernetes (٥٠٠+)
   ↓ كل service container منفصل، Helm charts
```

**المفتاح:** الكود نفسه لا يتغيّر بين المراحل. فقط الـ deployment config.

---

### 4️⃣ الجاهزية لتطبيق الجوال + SaaS (Mobile-Ready & SaaS-Ready)

**الفلسفة:** المشروع يبدأ كاستخدام عائلي على Pi، لكن احتمال التحول لـ SaaS موجود (٢٠-٥٠٪). نتخذ قرارات الآن **بدون تكلفة تقريباً** تحفظ المسار مفتوحاً، بدلاً من إضافة تعقيد لمستقبل غير مؤكد.

**الاستراتيجية:** Next.js عادي + جاهزية كاملة لـ Capacitor (PWA → Native App في ٣ أسابيع لاحقاً).

---

#### أ) REST API منفصل ومستقل من اليوم الأول

**القاعدة:** كل وظيفة backend تكون متاحة عبر REST API، **حتى لو الـ frontend الحالي يستخدم Server Actions**.

```typescript
// src/app/api/v1/bills/route.ts
export async function GET(req: Request) {
  const session = await authenticate(req);  // يقبل cookies أو JWT
  const bills = await billsRepository.list(session.householdId);
  return Response.json({ data: bills });
}

export async function POST(req: Request) {
  const session = await authenticate(req);
  const data = createBillSchema.parse(await req.json());
  const bill = await billsRepository.create(session.householdId, data);
  return Response.json({ data: bill }, { status: 201 });
}

// src/app/[locale]/bills/page.tsx (Server Component)
async function BillsPage() {
  // داخلياً يستخدم نفس الـ repository
  const bills = await billsRepository.list(getCurrentHouseholdId());
  return <BillsList bills={bills} />;
}
```

**الفائدة:** عند بناء mobile app، يستخدم نفس الـ endpoints بدون تعديل واحد على الـ backend.

#### ب) Authentication يدعم Cookies + JWT في Headers

```typescript
// src/core/auth/authenticate.ts
export async function authenticate(req: Request): Promise<Session> {
  // الجوال يرسل JWT في header
  const bearerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (bearerToken) return verifyJWT(bearerToken);

  // الويب يستخدم httpOnly cookie
  const cookieToken = req.cookies.get('session')?.value;
  if (cookieToken) return verifyJWT(cookieToken);

  throw new UnauthorizedError();
}
```

**JWT design:**
- Access token: ١٥ دقيقة (قصير لأمان)
- Refresh token: ٣٠ يوم (للجوال خاصة)
- Refresh token rotation عند كل استخدام
- Phone OTP يعطي JWT pair في response (للويب: httpOnly cookies + للجوال: في JSON)

#### ج) TanStack Query من اليوم الأول (Offline-First)

```bash
npm install @tanstack/react-query
```

```typescript
// src/features/bills/hooks/useBills.ts
export function useBills() {
  return useQuery({
    queryKey: ['bills'],
    queryFn: () => api.bills.list(),
    staleTime: 5 * 60 * 1000,         // 5 دقائق cache
    gcTime: 24 * 60 * 60 * 1000,       // يوم كامل في memory
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,          // مهم جداً للجوال
  });
}

export function usePayBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.bills.pay(id),
    onMutate: async (id) => {
      // Optimistic update — يظهر فوراً حتى لو الشبكة بطيئة
      await qc.cancelQueries({ queryKey: ['bills'] });
      const previous = qc.getQueryData(['bills']);
      qc.setQueryData(['bills'], (old) =>
        old.map(b => b.id === id ? { ...b, status: 'PAID' } : b)
      );
      return { previous };
    },
    onError: (err, id, ctx) => {
      qc.setQueryData(['bills'], ctx.previous);  // rollback
    }
  });
}
```

**الفوائد:**
- يعمل offline لمدة قصيرة (5 دقائق - 24 ساعة)
- Optimistic updates → UX سريع جداً
- Background refetch تلقائي عند العودة للنت
- جاهز لإضافة `persistQueryClient` لاحقاً (IndexedDB sync)

#### د) Mobile-First Design (موجود فعلاً ✅)

الـ Mockups الحالية مبنية mobile-first. نحافظ على هذا:
- **Bottom navigation** للجوال (≤ 768px)
- **Sidebar** للديسكتوب (≥ 768px)
- **Touch targets ≥ 48px** على كل العناصر التفاعلية
- **Viewport meta tag** صحيح:
  ```html
  <meta name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover" />
  ```
- **Safe area insets** للـ iPhone notch:
  ```css
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
  ```

#### هـ) Native Abstractions Layer

نُغلّف كل feature قد تختلف بين Web و Native في `core/native/`:

```typescript
// src/core/native/storage.ts
export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// التطبيق الويب
export const webStorage: Storage = {
  get: async (k) => localStorage.getItem(k),
  set: async (k, v) => localStorage.setItem(k, v),
  remove: async (k) => localStorage.removeItem(k),
};

// لاحقاً عند Capacitor:
// import { Preferences } from '@capacitor/preferences';
// export const nativeStorage: Storage = {
//   get: async (k) => (await Preferences.get({ key: k })).value,
//   ...
// };

// الكود يستورد من ملف موحّد
import { storage } from '@/core/native';  // يُحلّ تلقائياً حسب البيئة
```

**نفس النمط لـ:**
- `core/native/camera.ts` — رفع الصور (Web: file input → Native: Capacitor Camera)
- `core/native/notifications.ts` — Web Push → Native Push
- `core/native/share.ts` — Web Share API → Native Share Sheet
- `core/native/biometric.ts` — WebAuthn → Native Biometric

**عند تحويل لجوال:** نستبدل ٤ ملفات فقط، الباقي بدون تعديل.

#### و) Multi-Tenancy جاهز في الـ Schema

كل جدول مرتبط بـ `householdId` (بالفعل في الـ schema). هذا يعني:
- **بيت واحد لعائلتك:** يعمل ١٠٠٪
- **١٠٠ بيت لـ SaaS:** يعمل ١٠٠٪ بدون تغيير schema
- **عزل البيانات** مضمون عبر RLS (الطبقة المعمارية ٢)

**ما يُضاف لاحقاً للـ SaaS فقط:**
```prisma
// مرحلة SaaS (مُعطّل حالياً)
model Subscription {
  id              String   @id @default(cuid())
  household       Household @relation(fields: [householdId], references: [id])
  householdId     String   @unique
  plan            SubscriptionPlan
  status          SubscriptionStatus
  startDate       DateTime
  endDate         DateTime?
  trialEndsAt     DateTime?
  paymentMethod   String?         // "apple_iap", "google_play", "sadad", "stripe"
  externalId      String?         // Apple/Google subscription ID
  cancelledAt     DateTime?
  createdAt       DateTime @default(now())
}

enum SubscriptionPlan {
  FREE_TRIAL
  FAMILY_MONTHLY    // ٢٩ ر.س/شهر
  FAMILY_YEARLY     // ٢٩٠ ر.س/سنة (خصم شهرين)
  FAMILY_LIFETIME   // ١,٤٩٩ ر.س مرة واحدة
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
  IN_TRIAL
}

model BillingEvent {
  id            String   @id @default(cuid())
  subscriptionId String
  type          String   // "renewal", "cancellation", "refund"
  amount        Decimal? @db.Decimal(10, 2)
  currency      String   @default("SAR")
  metadata      Json?
  createdAt     DateTime @default(now())
}
```

**القاعدة:** لا حاجة لتفعيل هذه الجداول الآن، لكن وجودها في الـ schema يعني أن قرار SaaS يصبح **migration واحد** بدلاً من إعادة كتابة.

#### ز) PWA من الأسبوع ٧

```typescript
// src/app/manifest.ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'بيتي — إدارة المنزل العائلي',
    short_name: 'بيتي',
    description: 'منصة سعودية لإدارة شؤون البيت',
    start_url: '/ar',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1a1a1a',
    theme_color: '#c9a961',
    lang: 'ar-SA',
    dir: 'rtl',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable.png', sizes: '512x512',
        type: 'image/png', purpose: 'maskable' }
    ],
    screenshots: [/* ... */],
    shortcuts: [
      { name: 'الفواتير', url: '/ar/bills' },
      { name: 'المهام', url: '/ar/chores' },
      { name: 'المشتريات', url: '/ar/shopping' }
    ]
  };
}
```

**Service Worker** (next-pwa أو Workbox مباشرة):
- Cache-first للـ assets
- Network-first للـ API
- Offline fallback page

**النتيجة:**
- المستخدم يفتح baity.com على الجوال
- يضغط "إضافة للشاشة الرئيسية"
- يحصل على تطبيق كامل (بدون شريط متصفح)
- يعمل offline لـ ٢٤ ساعة

#### ح) أداء صارم (مهم جداً للجوال)

**حدود في CI:**
```yaml
# .github/workflows/ci.yml
- name: Bundle size check
  run: |
    npm run build
    npx bundlesize  # يفشل لو initial bundle > 200KB

- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    configPath: '.lighthouserc.json'
    # Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95
```

**قرارات الأداء من اليوم الأول:**
- ✅ Server Components افتراضياً (Client Components فقط للتفاعل)
- ✅ `next/image` لكل الصور مع `sizes` صحيحة
- ✅ Lazy loading للـ components الثقيلة (`dynamic(() => import(...))`)
- ✅ Font subsetting — تحميل أرقام عربية + الحروف فقط
- ✅ لا مكتبات ثقيلة (ابتعد عن moment.js → date-fns، lodash → الدوال الأصلية)

#### ط) خطة التحويل لـ SaaS (عند القرار)

**ما يحتاج إضافته فقط (٣ أسابيع لاحقاً):**

| المهمة | المدة | ملاحظات |
|-------|------|--------|
| تفعيل جداول Subscription | يوم | Schema موجود |
| تكامل Stripe / SADAD | ٣ أيام | للدفع المباشر |
| Apple/Google IAP | ٤ أيام | داخل Capacitor |
| Onboarding flow جديد | يومان | تجربة + تسجيل |
| Admin dashboard | ٣ أيام | إدارة الاشتراكات |
| Email service (Postmark) | يومان | فواتير، تذكيرات |
| Capacitor wrapper | ٤ أيام | Build للـ App Store |
| Analytics + Mixpanel | يوم | تتبع المستخدمين |
| ASO (App Store Optimization) | يوم | عناوين، صور، وصف |

**المجموع: ٢١ يوم عمل = ٣ أسابيع**

مقارنة بمن لا يطبّق هذه القرارات: **١٢-١٦ أسبوع** للتحويل.

---

#### ملخّص الجاهزية للـ Mobile + SaaS

| القرار | يُطبّق متى | تكلفة الآن | فائدة لاحقاً |
|--------|-----------|------------|--------------|
| REST API منفصل | اليوم ١ | ١-٢ ساعة | ضروري للجوال |
| JWT في headers | اليوم ٣ | ٣ ساعات | ضروري للجوال |
| TanStack Query | اليوم ٥ | يوم | offline + UX |
| Mobile-first design | موجود | صفر | الواجهة جاهزة |
| Native abstractions | اليوم ٥ | ساعتان | تحويل أسهل ٥× |
| Multi-tenancy في schema | اليوم ٢ | صفر | موجود |
| Subscription schema (مُعطّل) | اليوم ٢ | ساعتان | Migration واحد فقط |
| PWA manifest + SW | الأسبوع ٧ يوم ٤٠ | يوم | تثبيت كتطبيق |
| Performance gates في CI | اليوم ٦ | ساعة | ضروري للجوال |
| Analytics-ready | اليوم ٤ | ساعة | تتبع جاهز |

**المجموع الإضافي: يومان فقط على الـ ٤٨ يوم.**

**النتيجة:**
- لو ما تحوّل SaaS أبداً → خسرت يومين، كسبت كود نظيف.
- لو تحوّل بعد سنة → وفّرت ٣-٤ أشهر من إعادة الكتابة.
- لو قرّرت تطبيق جوال فقط (بدون SaaS) → ٣ أسابيع لـ Capacitor.

---

### 📋 ملخّص: ما يُضاف للأسبوع ١

| اليوم | ما يُضاف |
|------|---------|
| اليوم ١ | بنية المجلدات Feature-Based + ESLint + Prettier + Husky pre-commit + REST API structure |
| اليوم ٢ | Prisma + CUID + soft deletes + indexes + Subscription schema (مُعطّل) + multi-tenancy ready |
| اليوم ٣ | Auth (Supabase) + JWT في headers + middleware + RBAC + Rate limiting |
| اليوم ٤ | i18n setup (next-intl) + ar.json + arabic digits enforcement + Analytics-ready |
| اليوم ٥ | Feature flags + Zod + Repository pattern + Vitest + TanStack Query + Native abstractions |
| اليوم ٦ | Docker + Caddy + secrets + backup مشفّر + CI + Bundle size + Lighthouse gates |

---

## 📅 الأسبوع ١: الأساس والمعمارية (٦ أيام)

> **الهدف:** بنية تحتية صلبة + قاعدة بيانات + Auth

### 🔹 اليوم ١ (السبت): إعداد المشروع + البنية المعمارية

```bash
ssh pi@192.168.100.64
cd ~/projects && mkdir baity && cd baity

npx create-next-app@latest . --typescript --tailwind --app --src-dir

# Core
npm install prisma @prisma/client
npm install @supabase/supabase-js
npm install lucide-react date-fns date-fns-jalali
npm install zod react-hook-form @hookform/resolvers
npm install clsx tailwind-merge sharp

# i18n من البداية
npm install next-intl

# Quality gates
npm install -D eslint-plugin-formatjs
npm install -D husky lint-staged
npm install -D vitest @vitest/ui @testing-library/react

# Security
npm install bcryptjs
npm install @upstash/ratelimit @upstash/redis
```

**إنشاء بنية المجلدات Feature-Based:**
```bash
mkdir -p src/{features,shared,core,server}
mkdir -p src/features/{bills,chores,shopping,appliances,warranty,archive,house-economy,notifications}
mkdir -p src/core/{auth,db,storage,i18n,notifications,config}
mkdir -p src/shared/{ui,hooks,lib,types}
mkdir -p src/i18n/messages

# pre-commit hooks
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

**ملفات أساسية:**
- `CLAUDE.md` (مرجع للأدوات الذكية)
- `DEV_LOG.md` (سجل يومي)
- `ARCHITECTURE.md` (المبادئ الثلاثة الموثقة)
- `SECURITY.md` (security policy + responsible disclosure)
- `.env.local.example`
- `.env.local` (في .gitignore)
- `docker-compose.dev.yml`
- `.eslintrc.json` (مع formatjs rules)
- `lint-staged.config.js`

### 🔹 اليوم ٢ (الأحد): قاعدة البيانات الكاملة + Prisma

**Schema موحّد** (يشمل اقتصاد البيت من البداية):

```prisma
// === Core ===
model User {
  id          String    @id @default(cuid())
  phone       String    @unique
  name        String
  avatarUrl   String?
  birthDate   DateTime? // مهم لتحديد سن الطفل
  createdAt   DateTime  @default(now())
  memberships HouseholdMember[]
}

model Household {
  id        String    @id @default(cuid())
  name      String
  city      String?
  members   HouseholdMember[]
  bills     Bill[]
  chores    Chore[]
  shoppingLists ShoppingList[]
  appliances Appliance[]
  jobMenuItems JobMenuItem[]
  createdAt DateTime  @default(now())
}

model HouseholdMember {
  id          String    @id @default(cuid())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  household   Household @relation(fields: [householdId], references: [id])
  householdId String
  role        Role      @default(MEMBER)
  age         Int?      // مهم لمنيو الأعمال
  points      Int       @default(0)
  joinedAt    DateTime  @default(now())

  wallet      ChildWallet?
  jobInstances JobInstance[]

  @@unique([userId, householdId])
}

enum Role { OWNER ADMIN MEMBER CHILD }

// === Bills (HomeHub) ===
model Bill {
  id              String    @id @default(cuid())
  household       Household @relation(fields: [householdId], references: [id])
  householdId     String
  category        String
  provider        String?
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

// === Chores (Grocy logic) ===
model Chore {
  id                String    @id @default(cuid())
  household         Household @relation(fields: [householdId], references: [id])
  householdId       String
  name              String
  description       String?
  periodType        PeriodType
  periodDays        Int?
  periodWeekDay     Int?
  periodMonthDay    Int?
  assignmentType    AssignmentType @default(NO_ASSIGNMENT)
  assignedMembers   String[]
  firstExecutionDate DateTime  @default(now())
  nextDueDate       DateTime?
  lastExecutedAt    DateTime?
  lastExecutedBy    String?
  trackDateOnly     Boolean   @default(false)
  dueDateRollover   Boolean   @default(true)
  pointsReward      Int       @default(0)
  notifyBeforeDays  Int       @default(1)
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  executions        ChoreExecution[]
}

enum PeriodType { MANUALLY DAILY DYNAMIC_REGULAR WEEKLY MONTHLY YEARLY }
enum AssignmentType { NO_ASSIGNMENT WHO_LEAST_DID_IT_FIRST RANDOM IN_ALPHABETIC_ORDER FIXED }

model ChoreExecution {
  id            String   @id @default(cuid())
  chore         Chore    @relation(fields: [choreId], references: [id])
  choreId       String
  executedBy    String
  executedAt    DateTime @default(now())
  notes         String?
  pointsAwarded Int      @default(0)
}

// === Shopping ===
model ShoppingList {
  id          String    @id @default(cuid())
  household   Household @relation(fields: [householdId], references: [id])
  householdId String
  name        String
  items       ShoppingItem[]
  createdAt   DateTime  @default(now())
}

model ShoppingItem {
  id        String       @id @default(cuid())
  list      ShoppingList @relation(fields: [listId], references: [id])
  listId    String
  name      String
  category  String?
  quantity  String?
  isChecked Boolean      @default(false)
  addedBy   String
  checkedAt DateTime?
  createdAt DateTime     @default(now())
}

// === Appliances + Warranty Archive ===
model Appliance {
  id              String    @id @default(cuid())
  household       Household @relation(fields: [householdId], references: [id])
  householdId     String
  name            String                  // "مكيف الصالة"
  brand           String?                 // "LG", "Samsung"
  model           String?                 // "AC-2024-X"
  serialNumber    String?                 // الرقم التسلسلي (مهم للضمان)
  category        String?                 // "تكييف", "مطبخ", "إلكترونيات", "أثاث"
  location        String?                 // "الصالة", "غرفة النوم الرئيسية"

  // معلومات الشراء
  purchaseDate    DateTime?
  purchasePrice   Decimal?  @db.Decimal(10, 2)
  store           String?                 // "اكسترا", "ساكو", "Amazon", "IKEA"
  storeOrderNumber String?                // رقم الطلب أو الفاتورة

  // الضمان
  warrantyStart   DateTime?
  warrantyEnd     DateTime?
  warrantyMonths  Int?                    // مدة الضمان بالأشهر (تُحسب تلقائياً)
  warrantyType    WarrantyType @default(MANUFACTURER)
  warrantyContact String?                 // رقم خدمة العملاء
  warrantyNotes   String?                 // ملاحظات (مثلاً "يتطلب الفاتورة الأصلية")
  warrantyNotifyDaysBefore Int @default(30) // تنبيه قبل X يوم من انتهاء الضمان

  // مفيد للبيع المستقبلي / التأمين
  imageUrl        String?                 // صورة الجهاز نفسه
  notes           String?
  isActive        Boolean   @default(true) // false إذا تم بيعه/التخلص منه

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  schedules       MaintenanceSchedule[]
  documents       WarrantyDocument[]
}

enum WarrantyType {
  MANUFACTURER          // ضمان الشركة المصنّعة
  STORE                 // ضمان المتجر
  EXTENDED              // ضمان ممتد مدفوع
  THIRD_PARTY           // طرف ثالث (تأمين)
  NONE                  // بدون ضمان
}

model WarrantyDocument {
  id              String    @id @default(cuid())
  appliance       Appliance @relation(fields: [applianceId], references: [id], onDelete: Cascade)
  applianceId     String
  type            DocumentType
  title           String                  // "فاتورة الشراء", "شهادة الضمان", "دليل المستخدم"
  fileUrl         String                  // Supabase Storage URL
  fileName        String                  // الاسم الأصلي
  fileSize        Int                     // بالبايت
  mimeType        String                  // "image/jpeg", "application/pdf"
  thumbnailUrl    String?                 // معاينة مصغّرة (للصور والـ PDF)
  ocrText         String?   @db.Text      // نص مستخرج بـ OCR (للبحث)
  uploadedBy      String                  // member ID
  uploadedAt      DateTime  @default(now())

  @@index([applianceId])
  @@index([type])
}

enum DocumentType {
  PURCHASE_INVOICE      // فاتورة الشراء (الأهم للضمان)
  WARRANTY_CARD         // كرت/شهادة الضمان
  USER_MANUAL           // دليل الاستخدام
  RECEIPT               // إيصال
  SERVICE_REPORT        // تقرير صيانة
  PRODUCT_PHOTO         // صورة المنتج
  OTHER                 // أخرى
}

// === Document Archive (عام — غير مرتبط بجهاز معيّن) ===
model DocumentArchive {
  id              String    @id @default(cuid())
  household       Household @relation(fields: [householdId], references: [id])
  householdId     String

  category        ArchiveCategory
  title           String                  // "عقد إيجار البيت 1447"
  description     String?
  fileUrl         String
  fileName        String
  fileSize        Int
  mimeType        String
  thumbnailUrl    String?
  ocrText         String?   @db.Text

  // تواريخ مهمة
  documentDate    DateTime?               // تاريخ الوثيقة نفسها
  expiryDate      DateTime?               // مهم للعقود/التأمين/الإقامات
  notifyBeforeDays Int?                   // تنبيه قبل الانتهاء

  tags            String[]                // ["مهم", "عقار", "تأمين"]
  uploadedBy      String
  uploadedAt      DateTime  @default(now())

  @@index([householdId])
  @@index([category])
  @@index([expiryDate])
}

enum ArchiveCategory {
  INVOICE               // فواتير غير مرتبطة بجهاز
  CONTRACT              // عقود (إيجار، عمل)
  INSURANCE             // وثائق تأمين
  GOVERNMENT            // وثائق حكومية (إقامة، رخصة، ملكية)
  MEDICAL               // تقارير طبية
  EDUCATION             // شهادات، نتائج مدرسية
  PROPERTY              // صكوك، عقود عقارية
  VEHICLE               // استمارة، تأمين سيارة
  OTHER
}

model MaintenanceSchedule {
  id              String     @id @default(cuid())
  appliance       Appliance  @relation(fields: [applianceId], references: [id])
  applianceId     String
  taskName        String
  intervalDays    Int
  lastDoneAt      DateTime?
  nextDueAt       DateTime
  notifyBeforeDays Int       @default(7)
  history         MaintenanceLog[]
}

model MaintenanceLog {
  id            String              @id @default(cuid())
  schedule      MaintenanceSchedule @relation(fields: [scheduleId], references: [id])
  scheduleId    String
  doneAt        DateTime            @default(now())
  doneBy        String?
  cost          Decimal?            @db.Decimal(10, 2)
  notes         String?
  attachmentUrl String?             // فاتورة الصيانة نفسها
}

// === House Economy (NEW) ===
model JobMenuItem {
  id              String    @id @default(cuid())
  household       Household @relation(fields: [householdId], references: [id])
  householdId     String
  title           String
  description     String?
  imageUrl        String?
  iconEmoji       String?   // 🚗 🧹 🌱 (للأطفال الصغار)
  reward          Decimal   @db.Decimal(8, 2)
  estimatedMinutes Int?
  minAge          Int       @default(4)
  maxAge          Int?
  category        String?   // "تنظيف", "ترتيب", "حديقة", "مطبخ"
  isActive        Boolean   @default(true)
  availableFor    String[]  // member IDs - empty means all
  weeklyLimit     Int?      // كم مرة يقدر الطفل يسويها أسبوعياً
  createdAt       DateTime  @default(now())
  jobs            JobInstance[]
}

model JobInstance {
  id              String      @id @default(cuid())
  jobMenuItem     JobMenuItem @relation(fields: [jobMenuItemId], references: [id])
  jobMenuItemId   String
  child           HouseholdMember @relation(fields: [childId], references: [id])
  childId         String
  status          JobStatus @default(STARTED)
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  approvedAt      DateTime?
  approvedBy      String?
  beforePhoto     String?
  afterPhoto      String?
  approvedAmount  Decimal?  @db.Decimal(8, 2)
  parentNotes     String?
  bonusAmount     Decimal?  @db.Decimal(8, 2) @default(0)
}

enum JobStatus { STARTED SUBMITTED APPROVED PARTIAL REJECTED }

model ChildWallet {
  id              String    @id @default(cuid())
  member          HouseholdMember @relation(fields: [memberId], references: [id])
  memberId        String    @unique
  balance         Decimal   @default(0) @db.Decimal(10, 2)
  totalEarned     Decimal   @default(0) @db.Decimal(10, 2)
  totalSpent      Decimal   @default(0) @db.Decimal(10, 2)
  totalSaved      Decimal   @default(0) @db.Decimal(10, 2)
  totalCharity    Decimal   @default(0) @db.Decimal(10, 2)

  spendPercent    Int       @default(50)
  savePercent     Int       @default(30)
  charityPercent  Int       @default(10)
  surprisePercent Int       @default(10)

  weeklyEarningsLimit Decimal? @db.Decimal(8, 2) // حد أعلى من الوالد
  goals           SavingsGoal[]
  transactions    WalletTransaction[]
}

model SavingsGoal {
  id            String    @id @default(cuid())
  wallet        ChildWallet @relation(fields: [walletId], references: [id])
  walletId      String
  title         String
  targetAmount  Decimal   @db.Decimal(10, 2)
  currentAmount Decimal   @default(0) @db.Decimal(10, 2)
  imageUrl      String?
  achievedAt    DateTime?
  createdAt     DateTime  @default(now())
}

model WalletTransaction {
  id            String    @id @default(cuid())
  wallet        ChildWallet @relation(fields: [walletId], references: [id])
  walletId      String
  amount        Decimal   @db.Decimal(8, 2)
  type          TransactionType
  description   String
  relatedJobId  String?
  approvedBy    String?
  createdAt     DateTime  @default(now())
}

enum TransactionType {
  JOB_REWARD
  BONUS
  SPEND
  SAVE_DEPOSIT
  CHARITY
  GIFT
  TRANSFER
  WEEKLY_ALLOWANCE
}
```

```bash
npx prisma migrate dev --name init
```

### 🔹 اليوم ٣ (الإثنين): Auth + Onboarding

- Supabase Auth بـ Phone OTP
- تدفق onboarding: تسجيل → إنشاء بيت → إضافة أعضاء (مع تحديد السن للأطفال)
- إنشاء محفظة تلقائية لكل طفل عمره ٤-١٢

### 🔹 اليوم ٤ (الثلاثاء): i18n Setup + Layout + Theme

**i18n (الأهم):**
- تثبيت `next-intl` middleware
- إنشاء `src/i18n/config.ts` مع locales array
- إنشاء `messages/ar.json` كامل (٤٠٠+ مفتاح للـ MVP)
- إنشاء `messages/en.json` فارغ (هيكل فقط — يُترجم لاحقاً)
- نقل كل الصفحات تحت `app/[locale]/`
- ESLint rule يرفض النصوص الحرفية في JSX
- اختبار: تبديل اللغة من URL `/ar/...` ↔ `/en/...`

**Layout + Theme:**
- Sidebar + Header (يستخدم `useTranslations`)
- التقويم الهجري + الميلادي بـ wrapper مخصص
- Theme بألوان النخيل والصحراء
- Family widget
- `<html dir>` و `<html lang>` ديناميكيان حسب الـ locale

### 🔹 اليوم ٥ (الأربعاء): UI Library + Responsive Foundation + Testing

**UI Components:**
- shadcn/ui مع RTL/LTR logical properties (`ms-*`, `me-*`)
- مكونات أساسية: Button, Card, Dialog, Sheet, Input, Avatar, Badge, Toast
- خط Amiri + IBM Plex Sans Arabic للعربي، Inter للإنجليزي

**Responsive Foundation (إجباري):**
- إعداد container responsive: `container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl`
- Layout أساسي يدعم 5 breakpoints: mobile/sm/md/lg/xl/2xl
- مكوّن `<ResponsiveLayout>` يحدد:
  - جوال (`<md`): Bottom Navigation + عمود واحد
  - تابلت/Desktop (`md+`): Sidebar + محتوى متعدد الأعمدة
- مكوّن `<ResponsiveDialog>` يستخدم Sheet على الجوال + Dialog على الديسكتوب
- اختبار يدوي على 5 أبعاد: 375, 768, 1024, 1280, 1920

**Feature Flags + Testing:**
- إعداد `core/config/features.ts` (Feature Flags)
- إعداد Vitest + أول اختبار نموذجي على `period-engine`
- Repository pattern نموذجي على وحدة Bills

### 🔹 اليوم ٦ (الخميس): Docker + Security Hardening + CI

**Docker:**
- Dockerfile متعدد المراحل (multi-stage build)
- `docker-compose.prod.yml` مع Caddy
- Docker secrets للـ DB password وtokens

**Security:**
- إعداد `clamav` container لفحص الملفات
- سكريبت EXIF stripping للصور المرفوعة
- Backup script يومي مشفّر بـ `age`
- Rate limiting middleware عام

**CI/CD:**
- `.github/workflows/ci.yml`: typecheck → lint → test → build → audit
- Dependabot لـ npm packages
- نشر على Pi
- Push للـ repo `baity`

**Deliverable الأسبوع:**
- أساس كامل + قاعدة بيانات تحوي ٢٢+ جدول + Auth يعمل
- ⭐ بنية مجلدات Feature-Based جاهزة للتوسع
- ⭐ i18n يعمل (عربي حالياً، إنجليزي جاهز للتفعيل)
- ⭐ Security baseline: secrets, RLS, validation, file scanning, EXIF stripping
- ⭐ CI/CD pipeline يعمل + tests + linting + audit

---

## 📅 الأسبوع ٢: وحدة الفواتير (٦ أيام)

### 🔹 اليوم ٧: Bills CRUD أساسي
### 🔹 اليوم ٨: مزودي الخدمة السعوديين + شعارات
### 🔹 اليوم ٩: الفواتير المتكررة + Cron
### 🔹 اليوم ١٠: رفع المرفقات (Supabase Storage)
### 🔹 اليوم ١١: حالات الفواتير + سجل الدفع
### 🔹 اليوم ١٢: Dashboard widget + اختبار

**Deliverable:** وحدة فواتير تستخدمها فعلاً

---

## 📅 الأسبوع ٣: وحدة المهام الدورية (٦ أيام)

### 🔹 اليوم ١٣: Chores CRUD
### 🔹 اليوم ١٤: Period Calculation Engine
### 🔹 اليوم ١٥: Assignment Engine (٤ خوارزميات)
### 🔹 اليوم ١٦: Execute Chore + Points
### 🔹 اليوم ١٧: Due Date Rollover + Cron
### 🔹 اليوم ١٨: Kids Points Leaderboard

**Deliverable:** نظام مهام بمنطق Grocy كامل

---

## 📅 الأسبوع ٤: اقتصاد البيت — وحدة الأطفال (٦ أيام) ⭐ الجديد

> **الهدف:** منصة تربوية تعلّم الأطفال قيمة العمل والمال

### 🔹 اليوم ١٩ (السبت): Job Menu CRUD - واجهة الوالد

**ما يُبنى:**
- صفحة `/parent/jobs` لإدارة المنيو
- نموذج إضافة عمل: عنوان + وصف + رمز emoji (للأطفال الصغار) + صورة + مبلغ + سن أدنى/أعلى + تصنيف + حد أسبوعي
- Seed بيانات: ٢٠+ عمل افتراضي مقسم على فئتين عمريتين

**Seed افتراضي:**

```typescript
// seeds/job-menu-defaults.ts
export const defaultJobs = [
  // === للأطفال ٤-٨ سنوات ===
  {
    title: "ترتيب الألعاب",
    iconEmoji: "🧸",
    reward: 5,
    estimatedMinutes: 15,
    minAge: 4, maxAge: 8,
    category: "ترتيب"
  },
  {
    title: "طي الجوارب",
    iconEmoji: "🧦",
    reward: 5,
    estimatedMinutes: 10,
    minAge: 4, maxAge: 10,
    category: "ترتيب"
  },
  {
    title: "ري النباتات الداخلية",
    iconEmoji: "🪴",
    reward: 8,
    estimatedMinutes: 15,
    minAge: 5, maxAge: 12,
    category: "حديقة"
  },
  {
    title: "تنظيم المكتبة",
    iconEmoji: "📚",
    reward: 10,
    estimatedMinutes: 20,
    minAge: 6, maxAge: 12,
    category: "ترتيب"
  },
  {
    title: "مساعدة في تجهيز السفرة",
    iconEmoji: "🍽️",
    reward: 5,
    estimatedMinutes: 10,
    minAge: 5, maxAge: 12,
    category: "مطبخ"
  },

  // === للأطفال ٩-١٢ سنة ===
  {
    title: "غسيل السيارة",
    iconEmoji: "🚗",
    reward: 20,
    estimatedMinutes: 60,
    minAge: 9, maxAge: 17,
    category: "خارجي"
  },
  {
    title: "ترتيب المخزن",
    iconEmoji: "📦",
    reward: 20,
    estimatedMinutes: 45,
    minAge: 9, maxAge: 17,
    category: "ترتيب"
  },
  {
    title: "تلميع الأثاث",
    iconEmoji: "✨",
    reward: 15,
    estimatedMinutes: 45,
    minAge: 9, maxAge: 17,
    category: "تنظيف"
  },
  {
    title: "ترتيب الثلاجة",
    iconEmoji: "🧊",
    reward: 20,
    estimatedMinutes: 30,
    minAge: 10, maxAge: 17,
    category: "مطبخ"
  },
  {
    title: "تنظيف نوافذ غرفة كاملة",
    iconEmoji: "🪟",
    reward: 20,
    estimatedMinutes: 45,
    minAge: 10, maxAge: 17,
    category: "تنظيف"
  },
  {
    title: "مساعدة في الطبخ (وصفة كاملة)",
    iconEmoji: "👨‍🍳",
    reward: 15,
    estimatedMinutes: 60,
    minAge: 10, maxAge: 17,
    category: "مطبخ"
  },
  {
    title: "ترتيب الكراج",
    iconEmoji: "🚙",
    reward: 30,
    estimatedMinutes: 90,
    minAge: 12, maxAge: 17,
    category: "خارجي"
  },
  {
    title: "تعليم أخوي الصغير الواجب",
    iconEmoji: "📖",
    reward: 10,
    estimatedMinutes: 30,
    minAge: 12, maxAge: 17,
    category: "تعليمي"
  },
  {
    title: "ري الحديقة الخارجية",
    iconEmoji: "🌳",
    reward: 15,
    estimatedMinutes: 45,
    minAge: 9, maxAge: 17,
    category: "حديقة"
  },
  {
    title: "ترتيب الكبت كامل",
    iconEmoji: "👕",
    reward: 25,
    estimatedMinutes: 60,
    minAge: 10, maxAge: 17,
    category: "ترتيب"
  }
];
```

### 🔹 اليوم ٢٠ (الأحد): واجهة الطفل - تصفّح المنيو

**صفحة `/child/menu` ودّية للأطفال:**

- شبكة كروت كبيرة بألوان مرحة
- كل عمل: emoji كبير + عنوان واضح + المبلغ بخط عريض
- فلتر تلقائي حسب سن الطفل
- ترتيب حسب: مبلغ، فئة، شعبية
- زر "أبدأ" واضح وكبير

**اعتبارات UX للأطفال:**
- خط أكبر (16-20px للنصوص الأساسية)
- ألوان مشبعة وزاهية للأطفال الصغار
- أزرار touch targets ≥ 48px
- صور وايموجي بدلاً من نصوص حيث أمكن
- صوت/اهتزاز خفيف للتأكيدات (اختياري)

### 🔹 اليوم ٢١ (الإثنين): سير عمل الطفل (Job Workflow)

**الخطوات الكاملة:**

```
1. الطفل يضغط "أبدأ" على عمل
   ↓
2. JobInstance يُنشأ بحالة STARTED
   ↓
3. شاشة "العمل قيد التنفيذ" مع:
   - عداد وقت اختياري
   - زر "صورة قبل" (يحفظ في beforePhoto)
   - زر "خلصت" (للأطفال الصغار "انتهيت")
   ↓
4. الطفل يلتقط "صورة بعد" (إلزامي)
   ↓
5. JobInstance ينتقل لحالة SUBMITTED
   ↓
6. تنبيه فوري للوالد عبر:
   - Telegram (مع الصورة)
   - إشعار في التطبيق
   ↓
7. الوالد يفتح صفحة المراجعة
```

**صفحة `/parent/review/[jobInstanceId]`:**

- صورة قبل وبعد جنباً إلى جنب
- معلومات العمل + الطفل + الوقت المستغرق
- ٣ أزرار:
  - ✅ **موافق** (يُحوّل المبلغ كاملاً)
  - ✏️ **موافق جزئياً** (يدخل مبلغ + ملاحظة)
  - ❌ **أرفض** (يطلب إعادة + سبب)
- خيار إضافة بونص: ٢٥٪، ٥٠٪، ١٠٠٪، مخصص

### 🔹 اليوم ٢٢ (الثلاثاء): محفظة الطفل + الأهداف

**صفحة `/child/wallet`:**

تصميم مرح يشبه ألعاب الأطفال:

```
╔═══════════════════════════╗
║  محفظة نورة 👧            ║
║                            ║
║      ٨٧.٥٠ ر.س            ║
║      ━━━━━━━━━━━           ║
║                            ║
║  🎯 هدفك: دراجة هوائية    ║
║  ┌───────────────────┐    ║
║  │ ████████░░ ٧٠٪    │    ║
║  └───────────────────┘    ║
║  باقي: ٣٧.٥٠ ر.س          ║
║                            ║
║  📊 هذا الشهر:             ║
║  💰 كسبت: ١٢٠ ر.س         ║
║  💎 ادخرت: ٤٢ ر.س         ║
║  ❤️ تصدّقت: ١٤ ر.س         ║
║  🛍️ صرفت: ٧٠ ر.س          ║
║                            ║
║  [اختار عمل جديد]          ║
║  [طلب صرف]                 ║
║  [تغيير الهدف]             ║
╚═══════════════════════════╝
```

**ميزات الأهداف:**
- إنشاء هدف مع صورة (مثلاً صورة الدراجة)
- شريط تقدّم كبير
- عند تحقيق ٥٠٪ → احتفال داخل التطبيق
- عند تحقيق ١٠٠٪ → "🎉 مبروك! تكلّم مع بابا/ماما"

### 🔹 اليوم ٢٣ (الأربعاء): التقسيم التلقائي + الصدقة

**عند موافقة الوالد على عمل (مثلاً ٢٠ ر.س):**

```typescript
async function distributeReward(
  walletId: string,
  amount: number,
  jobId: string
) {
  const wallet = await prisma.childWallet.findUnique({ where: { id: walletId } });

  const spendAmount = amount * (wallet.spendPercent / 100);
  const saveAmount = amount * (wallet.savePercent / 100);
  const charityAmount = amount * (wallet.charityPercent / 100);
  const surpriseAmount = amount * (wallet.surprisePercent / 100);

  // معاملة واحدة شاملة
  await prisma.$transaction([
    prisma.walletTransaction.create({
      data: { walletId, amount, type: 'JOB_REWARD',
              description: 'أجر عمل', relatedJobId: jobId }
    }),
    prisma.walletTransaction.create({
      data: { walletId, amount: -saveAmount, type: 'SAVE_DEPOSIT',
              description: 'ادخار تلقائي' }
    }),
    prisma.walletTransaction.create({
      data: { walletId, amount: -charityAmount, type: 'CHARITY',
              description: 'صدقة تلقائية' }
    }),
    // تحديث الإجماليات
    prisma.childWallet.update({
      where: { id: walletId },
      data: {
        balance: { increment: amount - saveAmount - charityAmount },
        totalEarned: { increment: amount },
        totalSaved: { increment: saveAmount },
        totalCharity: { increment: charityAmount }
      }
    })
  ]);
}
```

**ميزة الصدقة:**
- الطفل يختار جمعية خيرية من قائمة (الإحسان، إطعام، الراجحي الخيرية، إلخ)
- شهرياً، الوالد ينقل المبلغ المتراكم
- يصدر "شهادة شكر" داخل التطبيق

### 🔹 اليوم ٢٤ (الخميس): تقارير شهرية + Telegram

**تقرير شهري للطفل (PDF أو شاشة):**

```
شهر شوال ١٤٤٧ — تقرير نورة

🎯 الإنجازات:
   • ٨ أعمال أنجزت
   • ١٢٠ ر.س كسبت
   • أعلى عمل: ترتيب المخزن (٢٠ ر.س)

💎 الادخار:
   • ٣٦ ر.س ادّخرت
   • نمو رصيد الادخار: ٣٠٪
   • هدفك (دراجة): ٧٠٪ من المبلغ

❤️ الخير:
   • ١٢ ر.س للجمعيات الخيرية
   • شهادة شكر من جمعية الإحسان

🏆 المركز: الأول هذا الشهر بين الأطفال

📈 مقارنة بالشهر الماضي:
   • الأعمال: +٣٣٪
   • الكسب: +٢٥٪
```

**تنبيهات Telegram تربوية:**

للطفل (إذا عنده Telegram):
- "نورة، عندك ٣ أعمال جديدة في المنيو 🎁"
- "🎉 مبروك! وصلت ٧٠٪ من هدفك (دراجة)"
- "💎 تذكير: ادخارك هذا الأسبوع ١٢ ر.س"

للوالد:
- "🔔 نورة خلّصت 'ترتيب الألعاب' — انتظر مراجعتك"
- "📊 تقرير أسبوعي: الأطفال أنجزوا ١٥ عمل"
- "⚠️ سعد قارب على حد ٥٠ ر.س الأسبوعي"

**Deliverable الأسبوع:** نظام تربوي مالي كامل للأطفال

---

## 📅 الأسبوع ٥: قائمة المشتريات + Realtime (٦ أيام)

### 🔹 اليوم ٢٥: Shopping Lists CRUD
### 🔹 اليوم ٢٦: Realtime Sync (Supabase)
### 🔹 اليوم ٢٧: التصنيف التلقائي العربي
### 🔹 اليوم ٢٨: Item History + Suggestions
### 🔹 اليوم ٢٩: Quick Add UI
### 🔹 اليوم ٣٠: اختبار مع العائلة

---

## 📅 الأسبوع ٦: الصيانة + الضمانات + Telegram (٧ أيام)

### 🔹 اليوم ٣١ (السبت): Appliances CRUD الموسّع

**ما يُبنى:**
- صفحة `/appliances` — قائمة الأجهزة بكروت بصرية
- نموذج إضافة جهاز: الاسم، البراند، الموديل، الرقم التسلسلي، الفئة، الموقع
- معلومات الشراء: التاريخ، السعر، المتجر، رقم الطلب
- Seed افتراضي للمتاجر السعودية: اكسترا، ساكو، عبدالصمد القرشي، Amazon.sa، IKEA، جرير، نون، السيف غاليري
- Seed للفئات: تكييف، مطبخ، إلكترونيات، أثاث، أدوات، أجهزة شخصية

### 🔹 اليوم ٣٢ (الأحد): أرشيف الفواتير والضمانات ⭐

**ما يُبنى:**

#### رفع المستندات لكل جهاز:
- صفحة `/appliances/[id]/documents`
- زر رفع متعدد الأنواع: فاتورة شراء، كرت ضمان، دليل استخدام، صور
- دعم: JPG, PNG, PDF حتى ٢٠ ميجا
- معاينة الصور والـ PDF داخل التطبيق
- Supabase Storage مع bucket منفصل: `warranty-docs/{householdId}/{applianceId}/`

#### حقول الضمان الذكية:
```typescript
// عند إدخال warrantyMonths، يحسب warrantyEnd تلقائياً
// عند إدخال warrantyEnd، يحسب warrantyMonths تلقائياً
function syncWarrantyFields(form: ApplianceForm) {
  if (form.purchaseDate && form.warrantyMonths) {
    form.warrantyEnd = addMonths(form.purchaseDate, form.warrantyMonths);
  }
}
```

#### مكتبة OCR للبحث:
- استخراج نص الفاتورة تلقائياً (Tesseract.js للعربي والإنجليزي)
- يُخزّن في `ocrText` للبحث لاحقاً
- البحث: "ابحث عن أي جهاز اشتريته من اكسترا" → يجد الفواتير بدون فتحها

#### واجهة المعاينة:
```
╔════════════════════════════════╗
║  مكيف الصالة LG                 ║
║  ━━━━━━━━━━━━━━━━━━━━━         ║
║                                  ║
║  📅 اشتُري: ١٥ رمضان ١٤٤٦       ║
║  💰 السعر: ٢,٤٠٠ ر.س            ║
║  🏪 المتجر: اكسترا              ║
║                                  ║
║  🛡️ الضمان: ساري                ║
║  ━━━━━━━━━━━━━━━━━━━━━         ║
║  ✅ ينتهي بعد ٨ أشهر و١٢ يوم    ║
║  📞 خدمة العملاء: 920000000      ║
║                                  ║
║  📎 المستندات (٤):              ║
║   📄 فاتورة الشراء.pdf          ║
║   🛡️ كرت الضمان.jpg             ║
║   📖 دليل المستخدم.pdf          ║
║   📸 صورة الجهاز.jpg            ║
║                                  ║
║  [+ إضافة مستند]                ║
║  [مشاركة عبر Telegram]          ║
╚════════════════════════════════╝
```

### 🔹 اليوم ٣٣ (الإثنين): الأرشيف العام (DocumentArchive)

**ما يُبنى:**
- صفحة `/archive` — أرشيف موحّد لكل وثائق البيت
- ٩ فئات: فواتير، عقود، تأمين، حكومي، طبي، تعليمي، عقاري، مركبات، أخرى
- بحث نصي سريع (يستخدم ocrText)
- فلاتر: حسب الفئة، التاريخ، الأقرب للانتهاء
- Tags قابلة للتخصيص

**حالات استخدام شائعة:**
- "وين عقد إيجار البيت؟" → بحث في فئة عقود
- "متى تنتهي رخصة قيادتي؟" → فلتر expiryDate
- "أبي شهادة تخرج ولدي" → فئة تعليمي
- "إقامة الشغّالة قاربت تنتهي" → تنبيه تلقائي

### 🔹 اليوم ٣٤ (الثلاثاء): Maintenance Schedules + History

- جدولة صيانة دورية لكل جهاز
- حساب nextDueAt تلقائياً
- سجل صيانة مع تكلفة + مرفق فاتورة الصيانة
- إعادة جدولة تلقائية بعد كل تنفيذ

### 🔹 اليوم ٣٥ (الأربعاء): تنبيهات الضمان والوثائق

**Cron يومي يفحص:**
- ✅ ضمانات الأجهزة المقاربة على الانتهاء (٣٠ يوم افتراضياً)
- ✅ وثائق الأرشيف ذات `expiryDate` المقاربة
- ✅ صيانة دورية مستحقة

**أمثلة للتنبيهات:**
```
🛡️ تنبيه ضمان
"مكيف الصالة LG" — الضمان ينتهي خلال ٢٨ يوم
📄 فاتورة الشراء جاهزة للمراجعة
[عرض التفاصيل]

📋 تنبيه وثيقة
"رخصة القيادة" — تنتهي خلال ٤٥ يوم
[فتح الأرشيف]

🔧 صيانة مستحقة
"تنظيف فلتر مكيف الصالة" — كل ٩٠ يوم
آخر مرة: ١٢ شعبان (منذ ٨٧ يوم)
[تم] [تأجيل]
```

### 🔹 اليوم ٣٦ (الخميس): Telegram Bot Setup
### 🔹 اليوم ٣٧ (الجمعة): Notifications Engine + Web Push

**Deliverable الأسبوع:**
- نظام صيانة كامل
- ⭐ أرشيف ضمانات وفواتير شامل بـ OCR
- ⭐ أرشيف عام لكل وثائق البيت
- تنبيهات Telegram تربط كل ذلك

---

## 📅 الأسبوع ٧: التحسين والإطلاق (٦ أيام)

### 🔹 اليوم ٣٧: Hijri Calendar + المناسبات
### 🔹 اليوم ٣٨: Performance + Indexing + Bundle optimization
### 🔹 اليوم ٣٩: Mobile UX (Bottom nav + Touch targets + Safe areas)
### 🔹 اليوم ٤٠: PWA كامل (Manifest + Service Worker + Offline + Install prompt)
### 🔹 اليوم ٤١: Backup + Monitoring + Family Onboarding
### 🔹 اليوم ٤٢: الإطلاق الرسمي + Analytics setup

---

## 📅 الأسبوع ٨: التحسينات النهائية (٦ أيام)

### 🔹 اليوم ٤٣-٤٤: تحسينات بناءً على ملاحظات العائلة
### 🔹 اليوم ٤٥-٤٦: ميزة "بنك العائلة" البسيطة (فائدة شهرية)
### 🔹 اليوم ٤٧: شهادات الإنجاز للأطفال (PDF)
### 🔹 اليوم ٤٨: التقرير الختامي + التوثيق + Demo Video

---

## 🎨 اعتبارات تصميم خاصة بالأطفال

### الفئة ٤-٨ سنوات:
- **الخط:** ١٨-٢٢px للأساسي، Cairo bold
- **الأزرار:** ≥ ٦٠px touch target
- **الألوان:** زاهية مرحة (أصفر، برتقالي، وردي، أخضر فاتح)
- **النصوص:** قصيرة جداً، اعتماد على الـ emoji والصور
- **التفاعلات:** صوت (اختياري) واهتزازات خفيفة عند الإنجاز
- **التعليمات:** صوتية اختيارية ("اضغط على الزرّ الأخضر لما تخلص")

### الفئة ٩-١٢ سنة:
- **الخط:** ١٦-١٨px
- **الأزرار:** ≥ ٤٨px
- **الألوان:** أكثر نضجاً (أخضر زيتي، ذهبي، بنفسجي)
- **النصوص:** أطول قليلاً، شرح أكثر
- **التفاعلات:** نقاط، تحديات، لوحة شرف
- **الاستقلالية:** يقدر يدير محفظته بنفسه

---

## 🛡️ اعتبارات أمنية للأطفال

1. **حساب الطفل** = subset من حساب الوالد، ليس حساب مستقل
2. **PIN قصير** (٤ أرقام) بدلاً من كلمة مرور
3. **لا قراءة لإيميلات** أو بيانات حساسة
4. **الموافقة على المعاملات** المالية يجب أن تكون من الوالد
5. **حد أعلى أسبوعي** قابل للضبط من الوالد
6. **سجل تدقيق كامل** لكل معاملة (Audit log)
7. **قفل الوصول للمنيو** بعد ١٠ مساءً (إعدادات الوالد)

---

## 💡 ميزات تربوية إضافية للمستقبل (مرحلة ٢)

محفوظة للمستقبل:
- **بنك العائلة:** إيداع بفائدة ١٠٪ شهرياً
- **سوق المهارات:** الأطفال الكبار يقدّمون خدمات
- **تحديات أسبوعية:** "أسبوع التنظيم" بضعف القيمة
- **قصص نجاح:** يومية مالية للأطفال
- **مكتبة تعليمية:** مقاطع فيديو قصيرة عن المال للأطفال
- **نظام الديون:** إذا أراد الطفل سلفة من الوالد بفائدة
- **أصدقاء وعائلات:** مقارنة مع أبناء الأصدقاء (اختياري)
- **هدايا للوالدين:** الطفل يصرف لإهداء أمه/أبيه

---

## 📊 المؤشرات الرئيسية للنجاح (KPIs)

بعد ٣ أشهر من الاستخدام:

### للوالد:
- ✅ ٩٠٪+ من الفواتير تتُدار من النظام (وليس يدوياً)
- ✅ ٨٠٪+ من المهام الدورية تُنفّذ في وقتها
- ✅ تقليل ٣٠٪ في "مَن يسوي ايش" المتنازع عليه

### للأطفال:
- ✅ كل طفل ينجز ٥+ أعمال شهرياً
- ✅ كل طفل عنده هدف ادخار نشط
- ✅ ٣٠٪+ من دخلهم يذهب للادخار/الصدقة (تربوياً)

### للنظام:
- ✅ ٩٩٪ uptime
- ✅ ٠ data loss
- ✅ <٢ ثانية متوسط زمن الاستجابة

---

## 🚀 الخطوة الفورية التالية

ما زالت كما هي — جاهز للبدء بـ يوم ١:

```bash
ssh pi@192.168.100.64
cd ~/projects && mkdir baity && cd baity
npx create-next-app@latest .
```

أو إذا تبي أجهز لك حزمة "اليوم الأول" كاملة (commands + ملفات جاهزة + CLAUDE.md + Docker)، خبرني.

---

**ملاحظة أخيرة:** هذي الميزة (اقتصاد البيت) هي ميزة قاتلة في السوق السعودي/الخليجي. يمكن تكون نقطة التميز الأكبر اللي تخلي العائلات تختار "بيتي" على أي تطبيق آخر.
