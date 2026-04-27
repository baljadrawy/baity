/**
 * ChildWalletWidget — محافظ الأطفال
 * Server Component — Prisma query مباشرة
 */

import { getTranslations } from 'next-intl/server';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { EmptyState } from '@/shared/ui/EmptyState';

export async function ChildWalletWidget() {
  const tWallet = await getTranslations('wallet');
  const tCommon = await getTranslations('common');

  const session = await getServerSession();
  if (!session) return null;

  // جلب أعضاء CHILD مع محافظهم
  const childMembers = await prisma.householdMember.findMany({
    where: {
      householdId: session.householdId,
      role: 'CHILD',
    },
    select: {
      id: true,
      age: true,
      user: { select: { name: true } },
      wallet: {
        select: {
          id: true,
          balance: true,
          totalSaved: true,
          totalCharity: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  // الأطفال الذين لديهم محفظة فقط
  const wallets = childMembers.filter((m) => m.wallet !== null);

  if (wallets.length === 0) {
    return (
      <EmptyState
        icon="👛"
        title={tWallet('noWallets')}
        description={tWallet('noWalletsDesc')}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3" role="list">
      {wallets.map((member) => {
        const wallet = member.wallet!;
        const name = member.user?.name ?? '?';

        return (
          <li key={member.id} className="rounded-xl border border-border bg-card p-4">
            {/* اسم الطفل */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {name[0]}
              </div>
              <span className="text-sm font-semibold text-foreground">{name}</span>
              {member.age && (
                <span className="text-xs text-muted-foreground">
                  ({tCommon('yearsOld', { age: member.age })})
                </span>
              )}
            </div>

            {/* الأرصدة — 3 أعمدة */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
                  {tWallet('balance')}
                </p>
                <p className="text-sm font-bold text-foreground" dir="ltr">
                  {Number(wallet.balance).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                  {tWallet('savings')}
                </p>
                <p className="text-sm font-bold text-foreground" dir="ltr">
                  {Number(wallet.totalSaved).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-2">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5">
                  {tWallet('charity')}
                </p>
                <p className="text-sm font-bold text-foreground" dir="ltr">
                  {Number(wallet.totalCharity).toFixed(2)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
