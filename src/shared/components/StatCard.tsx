/**
 * StatCard — بطاقة إحصاء مرنة للـ Dashboard
 *
 * Mobile-first، touch-safe، الأرقام دائماً dir="ltr"
 */

import { type ElementType } from 'react';
import { cn } from '@/shared/lib/utils';

const COLOR_MAP = {
  default: {
    bg: 'bg-muted/50',
    icon: 'bg-muted text-muted-foreground',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
  },
} as const;

type StatColor = keyof typeof COLOR_MAP;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  color?: StatColor;
  trend?: { value: number; label: string };
  dir?: 'ltr' | 'rtl';
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'default',
  trend,
  dir = 'ltr',
}: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div
      className={cn(
        'rounded-2xl p-4 border border-transparent',
        colors.bg
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* المحتوى */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">{title}</p>
          <p
            className="text-2xl font-bold tabular-nums tracking-tight"
            dir={dir}
          >
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-1 font-medium',
                trend.value > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend.value < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              )}
            >
              {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'} {trend.label}
            </p>
          )}
        </div>

        {/* الأيقونة */}
        <span
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
            colors.icon
          )}
          aria-hidden
        >
          <Icon className="w-5 h-5" />
        </span>
      </div>
    </div>
  );
}
