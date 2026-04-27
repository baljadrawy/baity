# 🏠 بيتي — Baity

> منصة إدارة المنزل الذكية للعائلة السعودية

[![Live Mockup](https://img.shields.io/badge/معاينة_حية-baljadrawy.github.io/baity-c9a961?style=for-the-badge)](https://baljadrawy.github.io/baity)
[![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Mockup_Phase-4a7d8e?style=for-the-badge)]()

---

## 🎯 الهدف

بناء أول منصة سعودية لإدارة المنزل العائلي، تجمع بين:
- إدارة الفواتير السعودية (STC, SEC, موبايلي, زين, المياه الوطنية)
- توزيع المهام المنزلية على الأسرة بذكاء
- قائمة مشتريات تفاعلية مشتركة
- جدولة صيانة الأجهزة الدورية

كل ذلك بواجهة عربية أصيلة مع التقويم الهجري ومراعاة المناسبات السعودية.

---

## 🌐 المعاينات الحية

| النسخة | الرابط |
|--------|--------|
| 📱 موبايل (الافتراضية) | [baljadrawy.github.io/baity](https://baljadrawy.github.io/baity) |
| 💻 سطح المكتب الكامل | [baljadrawy.github.io/baity/desktop.html](https://baljadrawy.github.io/baity/desktop.html) |
| 📜 النسخة الأولى | [baljadrawy.github.io/baity/v1.html](https://baljadrawy.github.io/baity/v1.html) |

---

## 📦 الميزات المستخرجة من المشاريع المفتوحة المصدر

تم تحليل ٤ مشاريع مفتوحة المصدر لاستخراج أفضل الممارسات:

### من **Grocy** (MIT License)
- ٦ أنواع تكرار للمهام (يدوي، يومي، أسبوعي، شهري، سنوي، **ديناميكي**)
- ٤ أنواع إسناد ذكي (ثابت، عشوائي، أبجدي، **الأقل تنفيذاً**)
- منطق Due Date Rollover
- ربط المهام بالمخزون (Consume Product)

### من **HomeHub**
- نظام الفواتير المتكررة
- Reminder Categories ملوّنة
- Feature Toggles
- Expiry Tracker

### من **Splitastic**
- Multi-Household (المستخدم في أكثر من بيت)
- نظام Roles (مالك، مدير، عضو، طفل)
- Expense Splitting

### إضافاتنا الأصلية
- 🇸🇦 RTL أصيل ومخطط من اليوم الأول
- 📅 التقويم الهجري + المناسبات السعودية
- 🏢 شعارات مزودي الخدمة السعوديين
- 🤖 Telegram Bot عربي للتنبيهات
- 🎮 نقاط ومكافآت للأطفال (Gamification)

📄 **التفاصيل الكاملة:** [EXTRACTED_FEATURES.md](./EXTRACTED_FEATURES.md)

---

## 🏗️ Stack تقني (مخطط)

```
Frontend:    Next.js 15 + TypeScript + Tailwind + shadcn/ui
Backend:     Next.js API Routes
Database:    PostgreSQL (Supabase) + Prisma
Auth:        Supabase Auth (OTP بالجوال)
Deployment:  Hetzner CAX11 + Docker + Caddy
Bot:         Telegram Bot (Python aiogram)
```

---

## 🗺️ خارطة الطريق

### ✅ المرحلة الحالية: Mockups & Research
- [x] دراسة المشاريع المفتوحة
- [x] استخراج أفضل الممارسات
- [x] تصميم Mockup للموبايل
- [x] تصميم Mockup لسطح المكتب
- [x] توثيق الميزات المستخرجة

### 🚧 المرحلة التالية: MVP Scaffold
- [ ] Next.js project setup
- [ ] Prisma schema (Households, Members, Bills, Chores)
- [ ] Auth flow
- [ ] Dashboard implementation
- [ ] Telegram Bot integration

### 🔮 المراحل اللاحقة
- [ ] قراءة الفواتير من الإيميل (Postmark + Claude)
- [ ] OCR للفواتير الورقية
- [ ] تكامل SADAD للدفع
- [ ] المساعد الذكي (Claude/Ollama)

---

## 👤 المؤلف

**باسم (أبو عساف)** · [@baljadrawy](https://github.com/baljadrawy)

مشروع شخصي ضمن مساعي ريادة الأعمال في إدارة المرافق ضمن رؤية ٢٠٣٠.

---

## 📝 الترخيص

MIT License — حر للاستخدام والتعديل والتسويق.
