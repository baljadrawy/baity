# 📦 الميزات المستخرجة من المشاريع المفتوحة المصدر

> دراسة تحليلية لما يميز كل مشروع، وكيف نبنيه بشكل أفضل في "بيتي"

---

## 🌟 المصدر #1: Grocy

**الرخصة:** MIT (حر تماماً للاستخدام والتعديل والتسويق)
**اللغة الأصلية:** PHP
**ما المميز فيه:** نظام المهام الدورية الأكثر تطوراً في عالم الـ open source

### ما استخرجناه:

#### ✅ نظام أنواع التكرار (Period Types)
ست استراتيجيات للجدولة بدلاً من نوع واحد ساذج:

| النوع | الوصف | استخدام مثالي |
|------|-------|--------------|
| `Manually` | جدولة يدوية فقط | مهمة لا تتكرر بانتظام |
| `Dynamic Regular` | يُعاد جدولتها بعد X يوم من آخر تنفيذ | "اغسل السيارة كل ١٠ أيام من آخر مرة غسلتها" |
| `Daily` | كل X يوم بانتظام | "اخراج النفايات كل يومين" |
| `Weekly` | أسبوعي مع تحديد اليوم | "تنظيف الحمامات كل جمعة" |
| `Monthly` | شهري مع تحديد التاريخ | "فحص فلتر المكيف كل ١ من الشهر" |
| `Yearly` | سنوي | "صيانة الكهرباء السنوية" |

**الفرق الجوهري** بين `Daily` (X يوم بانتظام من تاريخ الإنشاء) و `Dynamic Regular` (X يوم بعد آخر تنفيذ فعلي) — مهم جداً للمهام اللي يأخر فيها المستخدم.

#### ✅ نظام إسناد المهام (Assignment Types)
أربع خوارزميات لتوزيع المهام بدلاً من إسناد ثابت:

| النوع | الخوارزمية |
|------|-----------|
| `No Assignment` | بدون إسناد — أي شخص يمكنه التنفيذ |
| `Who Least Did It First` | يُسند للشخص الأقل تنفيذاً (عدالة آلية) |
| `Random` | عشوائي من القائمة |
| `In Alphabetic Order` | بترتيب أبجدي (دور دوري) |

**القيمة الحقيقية:** "Who Least Did It First" يحل مشكلة "نفس الشخص يسوي كل شي" التي تعاني منها كل العائلات.

#### ✅ ميزات متقدمة قابلة للتطبيق:
- **Due date rollover:** المهمة لا تتأخر، تتحرك تلقائياً لليوم التالي
- **Track date only:** بعض المهام لا تحتاج وقت محدد، فقط تاريخ
- **Consume product on execution:** ربط المهمة بمنتج ينقص من المخزون (مثال: تشغيل غسالة الصحون = استهلاك حبة منظف)
- **Last tracked time:** سجل تنفيذ تاريخي لكل مهمة

#### ✅ منطق "Next Due Date Calculation"
خوارزمية حساب الموعد القادم للصيانة بناءً على:
- آخر تاريخ تنفيذ
- نوع التكرار + الفترة
- عوامل rollover

**كود مرجعي بـ TypeScript:**
```typescript
function calculateNextDueDate(chore: Chore, lastExecution: Date | null): Date {
  if (chore.periodType === 'manually') return chore.nextEstimatedExecutionTime;

  const baseDate = chore.periodType === 'dynamic_regular' && lastExecution
    ? lastExecution
    : chore.firstExecutionDate;

  switch (chore.periodType) {
    case 'daily':
      return addDays(baseDate, chore.periodDays);
    case 'weekly':
      return nextWeekday(baseDate, chore.periodDays, chore.scheduledDay);
    case 'monthly':
      return addMonths(baseDate, chore.periodDays);
    case 'yearly':
      return addYears(baseDate, chore.periodDays);
    case 'dynamic_regular':
      return addDays(lastExecution || baseDate, chore.periodDays);
  }
}
```

#### ✅ فصل Tasks vs Chores
- **Tasks:** مهام لمرة واحدة (إصلاح جزّازة، تحديث وثائق)
- **Chores:** مهام دورية متكررة (غسيل، تنظيف)
- **Task Categories:** تصنيفات قابلة للتخصيص للمهام

---

## 🌟 المصدر #2: HomeHub

**الرخصة:** Open Source (مفتوح المصدر، جاهز للإلهام)
**اللغة:** PHP/JavaScript خفيفة
**ما المميز فيه:** فلسفة "Family First" — يستهدف الأسر مباشرة وليس الأفراد

### ما استخرجناه:

#### ✅ مفهوم "No-Login Family Dashboard"
بدلاً من حسابات معقدة لكل فرد:
- يُعرّف أفراد العائلة في ملف الإعدادات
- المستخدم يختار اسمه من قائمة عند الدخول
- كلمة مرور واحدة (اختيارية) للجهاز كله

**التطبيق في "بيتي":** نخليها هجين — حسابات حقيقية للأب/الأم، وأطفال يختارون اسمهم بـ PIN قصير.

#### ✅ Expense Tracker مع "Recurring Bills"
- المصاريف نوعان: عادي + متكرر
- المتكرر بأنواعه: يومي / أسبوعي / شهري
- مثال HomeHub: حليب يومي، جريدة، اشتراك Netflix، إيجار

**الميزة المخفية:** يمكن للمتكرر أن يولّد فاتورة افتراضياً كل دورة، ويذكّرك إذا ما سُجّل دفعها.

#### ✅ Feature Toggles في الإعدادات
كل ميزة قابلة للتشغيل/الإيقاف من ملف config:
```yaml
feature_toggles:
  shopping_list: true
  chores: true
  expense_tracker: true
  expiry_tracker: true
  bills: true
```

**التطبيق:** ندعم Feature Flags من اليوم الأول — بعض العائلات تريد فقط الفواتير، البعض الكل.

#### ✅ Reminder Categories مع ألوان
```yaml
categories:
  - key: bills
    label: الفواتير
    color: "#0d9488"  # أخضر
  - key: health
    label: الصحة
    color: "#dc2626"  # أحمر
  - key: school
    label: المدرسة
    color: "#7c3aed"  # بنفسجي
```

**القيمة:** تصنيف بصري سريع — كل تذكير له لون يدل على نوعه.

#### ✅ Expiry Tracker (تتبع الصلاحيات)
- أدوية، مواد غذائية، ضمانات
- تنبيه قبل X يوم من الانتهاء
- ميزة لم تطلبها لكنها قيّمة جداً للمنزل السعودي (مخزون التموين، الأدوية)

---

## 🌟 المصدر #3: Splitastic

**الرخصة:** MIT
**ما المميز فيه:** نموذج "Households + Members" المثالي

### ما استخرجناه:

#### ✅ معمارية متعددة الأسر (Multi-Household)
```
User
  └── belongs to many Households (with Role)
       └── has many Members
            └── has many Tasks/Bills/Items
```

**القيمة:**
- المستخدم الواحد يقدر يكون عضو في أكثر من بيت (بيت العائلة + بيته الخاص + شقة الصيف)
- كل بيت له بياناته المعزولة
- أدوار مختلفة (Owner, Admin, Member, Child)

#### ✅ Expense Splitting (تقسيم المصاريف)
- فاتورة الكهرباء = ٤٠٠ ريال، تُقسم بالتساوي على ٤ أعضاء
- فاتورة شخصية لشخص واحد فقط
- نسب مخصصة (Bob يدفع ٦٠%, Alice ٤٠%)

**التطبيق في "بيتي":** ميزة قوية للأخوة في شقة، أو في شراكة سكن.

---

## 🌟 المصدر #4: Homechart

**الرخصة:** AGPL (تقيد الاستخدام التجاري — للإلهام فقط)

### ما استخرجناه (إلهام فقط):

#### ✅ Calendar View Integration
كل البيانات (مهام، فواتير، صيانة، مناسبات) تظهر في تقويم موحد. مهم جداً للأسرة السعودية لربطها مع المناسبات الدينية والاجتماعية.

#### ✅ Meal Planning + Auto-Shopping List
خطة الوجبات الأسبوعية تولّد قائمة المشتريات تلقائياً بناءً على المقادير.

---

## 📊 الجدول الموحّد: ما نأخذه فعلياً

| الميزة | المصدر | الأولوية | يدخل MVP؟ |
|--------|--------|---------|-----------|
| 6 أنواع تكرار للمهام | Grocy | 🔥 حرجة | ✅ |
| 4 أنواع إسناد ذكي | Grocy | 🔥 حرجة | ✅ |
| Dynamic Regular vs Daily | Grocy | 🔥 حرجة | ✅ |
| Due date rollover | Grocy | عالية | ✅ |
| Last tracked history | Grocy | عالية | ✅ |
| Tasks vs Chores separation | Grocy | عالية | ✅ |
| Recurring Bills | HomeHub | 🔥 حرجة | ✅ |
| Reminder Categories مع ألوان | HomeHub | متوسطة | ✅ |
| Feature Toggles | HomeHub | متوسطة | ⏳ مرحلة ٢ |
| Expiry Tracker | HomeHub | عالية | ⏳ مرحلة ٢ |
| Multi-Household | Splitastic | عالية | ✅ (مبسّط) |
| Roles (Owner/Admin/Member/Child) | Splitastic | عالية | ✅ |
| Expense Splitting | Splitastic | متوسطة | ⏳ مرحلة ٢ |
| Calendar Unified View | Homechart | متوسطة | ⏳ مرحلة ٢ |
| Meal Planning | Homechart | منخفضة | ⏳ مرحلة ٣ |

---

## 🎁 إضافاتنا الأصلية (ما لا يوجد في أي منهم)

هذه الميزات تميّز "بيتي" تميزاً حقيقياً:

1. **RTL أصيل** — صُمّم بالعربية من اليوم الأول
2. **التقويم الهجري** بجانب الميلادي
3. **شعارات مزودي الخدمة السعوديين** (STC, SEC, موبايلي, زين, المياه الوطنية)
4. **مناسبات سعودية مدمجة** (رمضان، العيدين، اليوم الوطني، عاشوراء)
5. **Telegram Bot عربي** للتنبيهات (لا يقدمه أي من الأربعة)
6. **نقاط ومكافآت للأطفال** (gamification للمهام)
7. **PVC Patches للجوائز** (ربط مع مشروعك التجاري)
8. **مساعد ذكي بـ Claude** (مرحلة لاحقة)
9. **قراءة الفواتير من الإيميل** (مرحلة لاحقة — Postmark + Claude)
10. **هوية بصرية مستوحاة من النخيل والصحراء**

---

## 🏗️ المخطط المعماري (محدّث بناءً على الاستخراج)

```
┌─────────────────────────────────────────────────────────┐
│                    "بيتي" Architecture                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Users ──► Households ──► Members (with Roles)          │
│              │                                            │
│              ├──► Bills (one-time + recurring)           │
│              │     ├── Bill Categories (with colors)     │
│              │     └── Bill Payments History            │
│              │                                            │
│              ├──► Chores (recurring tasks)              │
│              │     ├── 6 Period Types                    │
│              │     ├── 4 Assignment Types                │
│              │     └── Execution Log                    │
│              │                                            │
│              ├──► Tasks (one-time tasks)                │
│              │     └── Task Categories                  │
│              │                                            │
│              ├──► Shopping Lists                         │
│              │     ├── Categories (Aisles)               │
│              │     └── Items (with history)            │
│              │                                            │
│              ├──► Appliances                             │
│              │     └── Maintenance Schedules            │
│              │           └── Maintenance Log             │
│              │                                            │
│              └──► Reminders (Hijri-aware)                │
│                                                           │
│  Notification Layer:                                      │
│    ├── Telegram Bot (per household)                      │
│    ├── Web Push                                          │
│    └── Email (later)                                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📌 خلاصة قيمة الاستخراج

**بدون هذه الدراسة:** كنّا سنبني نظام مهام بسيط (تاريخ + إسناد ثابت) ثم نكتشف بعد شهرين أن المستخدمين يطلبون "Dynamic Regular" و "Who Least Did It First".

**مع هذه الدراسة:** نبدأ بمعمارية مدروسة تغطي ٩٠% من use cases من اليوم الأول، مستفيدين من ١٠ سنوات من التطوير في Grocy.

**التوفير الزمني المقدّر:** ٤-٦ أسابيع من العمل والـ iteration.
