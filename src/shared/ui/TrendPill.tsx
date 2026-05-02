/**
 * TrendPill — مؤشر اتجاه (↑/↓/▬) بنسبة مئوية
 * Server Component — يستقبل النسبة بصيغة جاهزة (string) وتسمية ARIA
 */

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type TrendDirection = 'up' | 'down' | 'flat';

interface TrendPillProps {
  /** الاتجاه — يحدد اللون والأيقونة */
  direction: TrendDirection;
  /** القيمة معروضة (مثلاً "12%") — تُمرَّر مُنسَّقة من الـ caller */
  label: string;
  /** semantic: هل الاتجاه «الأعلى» إيجابي (دخل) أم سلبي (مصروف)؟ */
  positiveWhen?: 'up' | 'down';
  /** نص قارئ الشاشة الكامل */
  ariaLabel?: string;
  className?: string;
}

export function TrendPill({
  direction,
  label,
  positiveWhen = 'up',
  ariaLabel,
  className,
}: TrendPillProps) {
  const isPositive =
    direction === 'flat'
      ? null
      : (direction === 'up' && positiveWhen === 'up') ||
        (direction === 'down' && positiveWhen === 'down');

  const styles =
    isPositive === null
      ? 'bg-muted/30 text-muted-foreground'
      : isPositive
        ? 'bg-success/10 text-success'
        : 'bg-destructive/10 text-destructive';

  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <span
      className={cn('trend-pill', styles, className)}
      aria-label={ariaLabel}
      dir="ltr"
    >
      <Icon size={12} aria-hidden="true" strokeWidth={2.5} />
      {label}
    </span>
  );
}
