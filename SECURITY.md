# 🔒 سياسة الأمن — "بيتي"

> **النسخة:** 1.0 | **آخر تحديث:** 2026-04-27
> هذا الملف هو القانون الأمني للمشروع. كل مطوّر يجب أن يقرأه قبل أي مساهمة.

---

## 1. البيانات الحساسة في المشروع

| نوع البيانات | مستوى الحساسية | الحماية المطلوبة |
|-------------|---------------|-----------------|
| أرقام الجوال | عالية | تشفير في DB، لا logging |
| صور الأطفال | عالية جداً | bucket مغلق + EXIF stripping + signed URLs |
| فواتير ومبالغ | عالية | Decimal، لا float، householdId isolation |
| PIN الأطفال | عالية | bcrypt hash، max 5 محاولات |
| وثائق الهوية | عالية جداً | bucket مشفّر، audit log |
| بيانات الضمانات | متوسطة | householdId isolation |

---

## 2. قواعد الأمن الذهبية (لا تكسرها أبداً)

### 2.1 الأسرار (Secrets)
```
✅ مسموح:    .env.local (في .gitignore)
✅ مسموح:    Docker secrets (الإنتاج)
✅ مسموح:    CI/CD environment variables
❌ ممنوع:    أي secret في الكود
❌ ممنوع:    أي secret في Git history
❌ ممنوع:    .env.local.example مع قيم حقيقية
```

### 2.2 Authentication
- **الوالدان:** Phone OTP عبر Supabase — **لا كلمات مرور أبداً**
- **الأطفال:** PIN 4 أرقام مع bcrypt ($rounds=12)
- **Tokens:** httpOnly cookies للويب، Bearer header للجوال
- **لا localStorage** للـ tokens — أبداً، بأي ذريعة
- **Session expiry:** 7 أيام للوالد، 24 ساعة للطفل
- **Max attempts:** 5 محاولات PIN → قفل 15 دقيقة

### 2.3 Authorization
```typescript
// كل API route يبدأ بهذا الترتيب الإجباري:
const session = await authenticate(req);   // 1. هل مسجّل؟
const member = await authorize(session);    // 2. هل عضو في هذا البيت؟
const data = schema.parse(await req.json()); // 3. هل البيانات صحيحة؟
// ثم الـ business logic
```

### 2.4 Database
- **كل query يفلتر بـ `householdId`** — لا استثناء
- **Supabase RLS** كطبقة حماية ثانية (حتى لو الكود به bug)
- **Soft deletes** — `deletedAt` بدلاً من DELETE (للتدقيق)
- **المبالغ المالية:** `Decimal @db.Decimal(10,2)` — لا Float أبداً

### 2.5 رفع الملفات
```
MIME whitelist: image/jpeg, image/png, image/webp, application/pdf
حد أقصى: 20MB
Magic byte check: التحقق من نوع الملف الفعلي
EXIF stripping: إجباري لكل الصور (خصوصاً صور الأطفال)
Bucket isolation: households/{householdId}/...
Signed URLs: صلاحية ساعة واحدة فقط
```

### 2.6 Input Validation
- **كل input يمر عبر Zod schema** — لا استثناء
- `convertToArabicDigits()` على كل حقل رقمي
- **SQL Injection:** Prisma يمنعها تلقائياً (parameterized queries)
- **XSS:** React يمنعها تلقائياً (JSX escaping)

---

## 3. Rate Limiting

| الـ Endpoint | الحد | السبب |
|-------------|------|------|
| `/api/auth/otp` | 5 req/دقيقة/IP | منع OTP spam |
| `/api/auth/verify` | 5 محاولات/10 دقائق/رقم | منع brute force |
| `/api/upload` | 20 ملف/ساعة/مستخدم | منع storage abuse |
| `/api/v1/jobs/start` | 10 req/دقيقة/طفل | منع spam |
| General API | 100 req/دقيقة/مستخدم | حماية عامة |

---

## 4. حماية بيانات الأطفال (COPPA-inspired)

- **عمر الطفل لا يُعرض** للأطفال أنفسهم (منع المقارنات)
- **صور الأطفال** في bucket مغلق لا يُفتح إلا بـ signed URL
- **EXIF stripping إجباري** — لإزالة الموقع الجغرافي من الصور
- **Audit log منفصل** لكل وصول لبيانات الأطفال
- **Right to delete:** حذف عضو = حذف كل بياناته (cascade)
- **لا مشاركة** بيانات الأطفال مع أي طرف ثالث

---

## 5. Logging & Monitoring

### ما نسجّله:
- تسجيل دخول/خروج (مع IP، بدون كلمة مرور)
- فشل المصادقة (مع عدد المحاولات)
- حذف البيانات (من قِبل من، متى، ماذا)
- موافقة/رفض الوالد على عمل الطفل
- أي تعديل على wallet الطفل
- رفع ملف (نوعه، حجمه، بدون محتواه)

### ما لا نسجّله أبداً:
- أرقام الجوال كاملة
- محتوى الصور
- مبالغ مالية مفصّلة في logs عامة
- PIN أو أي بيانات مصادقة

---

## 6. النسخ الاحتياطي

```bash
# يومياً في 3 صباحاً (cron)
pg_dump baity_prod | age --recipient $PUBLIC_KEY > backup_$(date +%Y%m%d).age

# التحقق شهرياً
age --decrypt backup_*.age | pg_restore --dry-run
```

- **التشفير:** `age` (بديل حديث لـ gpg)
- **التخزين:** مجلد خارجي عن الـ Pi (HDD/NAS أو cloud)
- **الاحتفاظ:** 30 يوم للنسخ اليومية، 12 شهر للشهرية
- **اختبار الاستعادة:** شهرياً — نسخة لا تُختبر = لا نسخة

---

## 7. Dependencies Security

```bash
# في كل CI run
npm audit --audit-level=high    # يفشل على critical/high
```

- **Dependabot** مفعّل للـ PRs التلقائية
- **Lock files** ملتزم بها (package-lock.json في Git)
- **License check:** MIT/Apache/ISC فقط — لا AGPL

---

## 8. Responsible Disclosure

إذا وجدت ثغرة أمنية في "بيتي":
1. **لا تفتح Issue عاماً** على GitHub
2. راسل مباشرة عبر البريد المخصص: security@baity.app (مستقبلاً)
3. اذكر: وصف الثغرة، خطوات إعادة الإنتاج، التأثير المحتمل
4. سنردّ خلال 48 ساعة ونُصلح خلال 7-14 يوم

---

**آخر تحديث:** 2026-04-27 | **بواسطة:** Claude (Cowork)
