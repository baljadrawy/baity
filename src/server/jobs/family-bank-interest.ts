/**
 * family-bank-interest — فائدة شهرية على مدخرات الأطفال
 *
 * يُشغَّل مرة في الشهر (يوم 1 من كل شهر).
 * يُضيف نسبة فائدة ثابتة (SAVINGS_INTEREST_RATE) على رصيد الادخار.
 * يُسجّل المعاملة بنوع BONUS مع وصف "فائدة شهرية".
 *
 * المعادلة: interest = totalSaved × rate / 100
 * الحد الأدنى: totalSaved > 0
 */

import { prisma } from '@/core/db';
import { Decimal } from '@prisma/client/runtime/library';

/** نسبة الفائدة الشهرية الافتراضية (2%) — قابلة للتخصيص بـ env */
const MONTHLY_RATE = parseFloat(process.env.SAVINGS_INTEREST_RATE ?? '2');

export interface InterestRunResult {
  processed: number;
  totalInterestPaid: number;
  errors: number;
}

/**
 * يُطبّق الفائدة الشهرية على كل محافظ الأطفال في المنصة.
 * يعمل بـ transaction لكل محفظة لضمان التسق.
 */
export async function runFamilyBankInterest(): Promise<InterestRunResult> {
  const result: InterestRunResult = { processed: 0, totalInterestPaid: 0, errors: 0 };

  // جلب كل المحافظ التي لديها مدخرات > 0
  const wallets = await prisma.childWallet.findMany({
    where: {
      totalSaved: { gt: 0 },
    },
    select: {
      id: true,
      totalSaved: true,
      balance: true,
      totalEarned: true,
    },
  });

  for (const wallet of wallets) {
    try {
      const saved = Number(wallet.totalSaved);
      if (saved <= 0) continue;

      const interest = parseFloat((saved * MONTHLY_RATE / 100).toFixed(2));
      if (interest <= 0) continue;

      const interestDecimal = new Decimal(interest);

      await prisma.$transaction([
        // تحديث رصيد المحفظة
        prisma.childWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: interestDecimal },
            totalSaved: { increment: interestDecimal },
            totalEarned: { increment: interestDecimal },
          },
        }),
        // تسجيل المعاملة
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: interestDecimal,
            type: 'BONUS',
            description: `فائدة شهرية ${MONTHLY_RATE}% على المدخرات`,
          },
        }),
      ]);

      result.processed++;
      result.totalInterestPaid += interest;
    } catch (err) {
      console.error(`[family-bank-interest] فشل تطبيق الفائدة على المحفظة ${wallet.id}:`, err);
      result.errors++;
    }
  }

  console.log(
    `[family-bank-interest] انتهى: ${result.processed} محفظة، `
    + `إجمالي الفائدة: ${result.totalInterestPaid.toFixed(2)} ر.س، `
    + `أخطاء: ${result.errors}`
  );

  return result;
}
