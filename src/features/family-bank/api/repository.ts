/**
 * FamilyBankRepository — مجمِّع محافظ الأطفال على مستوى المنزل
 *
 * "بنك العائلة" ليس جدولاً منفصلاً — هو aggregation لكل ChildWallet داخل المنزل.
 * يعرض: إجمالي المدخرات + الصدقة + سجل المعاملات + الفائدة الشهرية.
 */

import { prisma } from '@/core/db/prisma';
import type { TransactionType } from '@prisma/client';

const MONTHLY_RATE = parseFloat(process.env['SAVINGS_INTEREST_RATE'] ?? '2');

export interface FamilyBankSummary {
  totalBalance: number;
  totalSaved: number;
  totalCharity: number;
  totalEarned: number;
  walletsCount: number;
  monthlyInterestRate: number;
  /** تقدير الفائدة في الشهر القادم (إذا بقيت المدخرات كما هي) */
  estimatedNextInterest: number;
  /** فائدة الشهر الحالي حتى الآن */
  thisMonthInterest: number;
  members: Array<{
    memberId: string;
    name: string;
    balance: number;
    totalSaved: number;
    totalCharity: number;
  }>;
  recentTransactions: Array<{
    id: string;
    walletId: string;
    memberName: string;
    amount: number;
    type: TransactionType;
    description: string;
    createdAt: Date;
  }>;
}

export class FamilyBankRepository {
  constructor(private readonly householdId: string) {}

  async getSummary(): Promise<FamilyBankSummary> {
    const startThisMonth = new Date();
    startThisMonth.setDate(1);
    startThisMonth.setHours(0, 0, 0, 0);

    const wallets = await prisma.childWallet.findMany({
      where: { member: { householdId: this.householdId } },
      include: {
        member: { select: { id: true, user: { select: { name: true } } } },
      },
    });

    const walletIds = wallets.map((w) => w.id);

    const totals = wallets.reduce(
      (acc, w) => {
        acc.balance += Number(w.balance);
        acc.saved += Number(w.totalSaved);
        acc.charity += Number(w.totalCharity);
        acc.earned += Number(w.totalEarned);
        return acc;
      },
      { balance: 0, saved: 0, charity: 0, earned: 0 }
    );

    // فائدة هذا الشهر — مجموع معاملات BONUS بوصف الفائدة
    const thisMonthBonuses = walletIds.length
      ? await prisma.walletTransaction.findMany({
          where: {
            walletId: { in: walletIds },
            type: 'BONUS',
            createdAt: { gte: startThisMonth },
            description: { contains: 'فائدة' },
          },
          select: { amount: true },
        })
      : [];
    const thisMonthInterest = thisMonthBonuses.reduce(
      (s, t) => s + Number(t.amount),
      0
    );

    const recentTx = walletIds.length
      ? await prisma.walletTransaction.findMany({
          where: { walletId: { in: walletIds } },
          orderBy: { createdAt: 'desc' },
          take: 15,
        })
      : [];
    const walletNameMap = new Map(
      wallets.map((w) => [w.id, w.member.user.name])
    );

    return {
      totalBalance: totals.balance,
      totalSaved: totals.saved,
      totalCharity: totals.charity,
      totalEarned: totals.earned,
      walletsCount: wallets.length,
      monthlyInterestRate: MONTHLY_RATE,
      estimatedNextInterest: parseFloat(
        ((totals.saved * MONTHLY_RATE) / 100).toFixed(2)
      ),
      thisMonthInterest,
      members: wallets.map((w) => ({
        memberId: w.member.id,
        name: w.member.user.name,
        balance: Number(w.balance),
        totalSaved: Number(w.totalSaved),
        totalCharity: Number(w.totalCharity),
      })),
      recentTransactions: recentTx.map((t) => ({
        id: t.id,
        walletId: t.walletId,
        memberName: walletNameMap.get(t.walletId) ?? '—',
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };
  }
}
