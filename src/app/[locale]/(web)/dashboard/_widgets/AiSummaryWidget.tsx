/**
 * AiSummaryWidget — رؤى ذكية منشأة من بيانات حقيقية
 * Server Component
 *
 * يحسب 3 رؤى عملية من قاعدة البيانات:
 * 1. اتجاه المصروف هذا الشهر مقارنة بالماضي
 * 2. عدد + مجموع الفواتير المستحقة هذا الأسبوع
 * 3. أعلى فئة إنفاق
 *
 * عند توفر LLM لاحقاً نستبدل المنطق بصياغة طبيعية أكثر.
 */

import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { formatCurrency, formatPercent } from '@/core/i18n/format-number';
import type { Locale } from '@/i18n/config';
import { AiSummaryCard } from '@/shared/ui/AiSummaryCard';

const CATEGORY_LABEL_KEYS = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  TELECOM: 'telecom',
  INTERNET: 'internet',
  SUBSCRIPTION: 'subscription',
  RENT: 'rent',
  INSURANCE: 'insurance',
  OTHER: 'other',
} as const;

export async function AiSummaryWidget() {
  const t = await getTranslations('dashboard');
  const tCat = await getTranslations('bills.categories');
  const locale = (await getLocale()) as Locale;
  const session = await getServerSession();
  if (!session) return null;

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const in7Days = new Date(now.getTime() + 7 * 86400000);

  const [thisMonthPayments, lastMonthPayments, dueThisWeek, paymentsForCategory] =
    await Promise.all([
      prisma.billPayment.findMany({
        where: {
          paidAt: { gte: startThisMonth },
          bill: { householdId: session.householdId, deletedAt: null },
        },
        select: { amount: true },
      }),
      prisma.billPayment.findMany({
        where: {
          paidAt: { gte: startLastMonth, lt: startThisMonth },
          bill: { householdId: session.householdId, deletedAt: null },
        },
        select: { amount: true },
      }),
      prisma.bill.findMany({
        where: {
          householdId: session.householdId,
          deletedAt: null,
          status: { in: ['PENDING', 'DUE', 'OVERDUE'] },
          dueDate: { lte: in7Days },
        },
        select: { amount: true },
      }),
      prisma.billPayment.findMany({
        where: {
          paidAt: { gte: new Date(now.getTime() - 90 * 86400000) },
          bill: { householdId: session.householdId, deletedAt: null },
        },
        select: { amount: true, bill: { select: { category: true } } },
      }),
    ]);

  const totalThis = thisMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalLast = lastMonthPayments.reduce((s, p) => s + Number(p.amount), 0);

  const insights: string[] = [];

  // 1. اتجاه المصروفات
  if (totalLast > 0) {
    const change = (totalThis - totalLast) / totalLast;
    const abs = Math.abs(change);
    if (abs < 0.02) {
      insights.push(t('insights.expensesFlat'));
    } else if (change > 0) {
      insights.push(t('insights.expensesUp', { percent: formatPercent(abs, locale) }));
    } else {
      insights.push(t('insights.expensesDown', { percent: formatPercent(abs, locale) }));
    }
  }

  // 2. الفواتير القادمة
  if (dueThisWeek.length > 0) {
    const total = dueThisWeek.reduce((s, b) => s + Number(b.amount), 0);
    insights.push(
      t('insights.billsAlert', {
        count: dueThisWeek.length,
        amount: formatCurrency(total, locale),
      })
    );
  }

  // 3. أعلى فئة إنفاق
  if (paymentsForCategory.length > 0) {
    const byCat = new Map<string, number>();
    for (const p of paymentsForCategory) {
      const cat = p.bill.category as keyof typeof CATEGORY_LABEL_KEYS;
      byCat.set(cat, (byCat.get(cat) ?? 0) + Number(p.amount));
    }
    const sorted = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
    const [topCat] = sorted[0] ?? [];
    if (topCat) {
      const key = CATEGORY_LABEL_KEYS[topCat as keyof typeof CATEGORY_LABEL_KEYS] ?? 'other';
      const categoryLabel = tCat(key);
      insights.push(t('insights.topCategory', { category: categoryLabel }));
    }
  }

  // fallback إذا لم يكن هناك أي بيانات
  if (insights.length === 0) {
    insights.push(t('insights.expensesFlat'));
  }

  return (
    <AiSummaryCard
      badge={t('ai.badge')}
      title={t('ai.title')}
      insights={insights}
      viewMoreLabel={t('ai.viewMore')}
      viewMoreHref={`/${locale}/bills`}
    />
  );
}
