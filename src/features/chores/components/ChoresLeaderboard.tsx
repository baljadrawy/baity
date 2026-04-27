'use client';

/**
 * ChoresLeaderboard — لوحة ترتيب أفراد العائلة بالنقاط
 *
 * تُعرض أسفل قائمة المهام — تُشجّع المنافسة الصحية
 * Touch-friendly، Mobile-first، الأرقام عبر useFormat
 */

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import { useFormat } from '@/shared/hooks/useFormat';
import { Trophy } from 'lucide-react';

interface MemberStats {
  memberId: string;
  name: string;
  executionsThisMonth: number;
  pointsThisMonth: number;
  rank: number;
}

export function ChoresLeaderboard() {
  const t = useTranslations('chores');
  const f = useFormat();

  const { data, isLoading } = useQuery({
    queryKey: ['chores', 'leaderboard'],
    queryFn: () => api.get<MemberStats[]>('/chores/leaderboard'),
    staleTime: 5 * 60_000,
  });

  const members = data ?? [];

  if (isLoading) {
    return (
      <div className="h-32 rounded-2xl bg-muted animate-pulse" />
    );
  }

  if (members.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];
  const topThree = members.slice(0, 3);

  return (
    <section className="bg-card border border-border rounded-2xl p-4">
      {/* رأس القسم */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" aria-hidden />
        <h2 className="text-base font-semibold">{t('leaderboard.title')}</h2>
        <span className="text-xs text-muted-foreground ms-auto">{t('leaderboard.thisMonth')}</span>
      </div>

      {/* أعلى 3 */}
      <div className="flex items-end justify-center gap-4 mb-4">
        {/* الثاني */}
        {topThree[1] && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl" aria-hidden>🥈</span>
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <span className="text-2xl" aria-label={topThree[1].name}>
                {topThree[1].name.charAt(0)}
              </span>
            </div>
            <p className="text-xs font-medium text-center truncate w-20">{topThree[1].name}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {f.number(topThree[1].executionsThisMonth)} {t('leaderboard.tasks')}
            </p>
          </div>
        )}

        {/* الأول (أطول) */}
        {topThree[0] && (
          <div className="flex flex-col items-center gap-1 -mt-4">
            <span className="text-3xl" aria-hidden>🥇</span>
            <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center ring-2 ring-amber-400">
              <span className="text-3xl" aria-label={topThree[0].name}>
                {topThree[0].name.charAt(0)}
              </span>
            </div>
            <p className="text-sm font-semibold text-center truncate w-24">{topThree[0].name}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium" dir="ltr">
              {f.number(topThree[0].executionsThisMonth)} {t('leaderboard.tasks')}
            </p>
          </div>
        )}

        {/* الثالث */}
        {topThree[2] && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl" aria-hidden>🥉</span>
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <span className="text-2xl" aria-label={topThree[2].name}>
                {topThree[2].name.charAt(0)}
              </span>
            </div>
            <p className="text-xs font-medium text-center truncate w-20">{topThree[2].name}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {f.number(topThree[2].executionsThisMonth)} {t('leaderboard.tasks')}
            </p>
          </div>
        )}
      </div>

      {/* باقي الأعضاء */}
      {members.length > 3 && (
        <div className="space-y-2 border-t border-border pt-3">
          {members.slice(3).map((member) => (
            <div key={member.memberId} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-5 text-center" dir="ltr">
                {member.rank}
              </span>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm">
                {member.name.charAt(0)}
              </div>
              <span className="flex-1 text-sm">{member.name}</span>
              <span className="text-sm text-muted-foreground" dir="ltr">
                {f.number(member.executionsThisMonth)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
