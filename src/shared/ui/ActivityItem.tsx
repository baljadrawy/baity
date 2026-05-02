/**
 * ActivityItem — صف نشاط في الـ Activity Feed
 * Server Component
 */

import { CheckCircle2, ShoppingBag, UserPlus, Wallet, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type ActivityKind =
  | 'bill_paid'
  | 'chore_done'
  | 'shopping_added'
  | 'member_joined'
  | 'reward_earned';

const KIND_META: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  bill_paid: { icon: Receipt, tone: 'bg-success/10 text-success' },
  chore_done: { icon: CheckCircle2, tone: 'bg-info/10 text-info' },
  shopping_added: { icon: ShoppingBag, tone: 'bg-warning/10 text-warning' },
  member_joined: { icon: UserPlus, tone: 'bg-primary/10 text-primary' },
  reward_earned: { icon: Wallet, tone: 'bg-success/10 text-success' },
};

interface ActivityItemProps {
  message: string;
  /** الوقت النسبي مُنسَّق (مثلاً "قبل ساعة") */
  time: string;
  kind: ActivityKind;
  /** قيمة اختيارية على اليمين (مثل المبلغ) — جاهزة منسّقة */
  value?: string;
}

export function ActivityItem({ message, time, kind, value }: ActivityItemProps) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  return (
    <li className="flex items-center gap-3 py-3 transition-smooth">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0',
          meta.tone
        )}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-1">{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
      {value && (
        <span
          className="text-sm font-semibold text-foreground tabular-nums flex-shrink-0"
          dir="ltr"
          style={{ fontFeatureSettings: '"lnum", "tnum"' }}
        >
          {value}
        </span>
      )}
    </li>
  );
}
