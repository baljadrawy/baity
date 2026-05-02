/**
 * KpiCard — بطاقة KPI متطورة:
 * - أيقونة Lucide ملوّنة بحسب الـ semantic
 * - رقم كبير بخط مونوسبيس (LTR locked)
 * - sparkline اختياري في الزاوية
 * - trend pill + label فرعي
 *
 * Server Component — كل النصوص والقيم تُمرَّر جاهزة من الـ caller
 * (الـ caller يستخدم getTranslations + format-number)
 */

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { MiniSparkline } from './MiniSparkline';
import { TrendPill, type TrendDirection } from './TrendPill';

export type KpiTone = 'success' | 'warning' | 'error' | 'info' | 'primary';

const TONE_STYLES: Record<KpiTone, { icon: string; ring: string; spark: string }> = {
  success: {
    icon: 'bg-success/10 text-success',
    ring: 'group-hover:border-success/40',
    spark: 'var(--color-success)',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    ring: 'group-hover:border-warning/40',
    spark: 'var(--color-warning)',
  },
  error: {
    icon: 'bg-destructive/10 text-destructive',
    ring: 'group-hover:border-destructive/40',
    spark: 'var(--color-error)',
  },
  info: {
    icon: 'bg-info/10 text-info',
    ring: 'group-hover:border-info/40',
    spark: 'var(--color-info)',
  },
  primary: {
    icon: 'bg-primary/10 text-primary',
    ring: 'group-hover:border-primary/40',
    spark: 'var(--color-primary)',
  },
};

interface KpiCardProps {
  /** نص التسمية (مُترجَم) */
  label: string;
  /** القيمة معروضة كنص جاهز (مُنسَّق رقمياً عبر format-number) */
  value: string;
  /** نص فرعي تحت القيمة (مُترجَم) */
  sub?: string;
  /** أيقونة Lucide */
  icon: LucideIcon;
  /** اللون الدلالي */
  tone?: KpiTone;
  /** بيانات sparkline اختيارية */
  sparkline?: number[];
  /** اتجاه الـ trend */
  trendDirection?: TrendDirection;
  /** نص الـ trend (مثل "12%") */
  trendLabel?: string;
  /** هل الارتفاع إيجابي؟ (مثلاً للدخل true، للمصروف false) */
  trendPositiveWhen?: 'up' | 'down';
  /** رابط التفاصيل — يجعل البطاقة قابلة للنقر */
  href?: string;
  /** نص ARIA كامل لقارئ الشاشة (مثل "محفظة المنزل: 1,250 ر.س") */
  ariaLabel?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'primary',
  sparkline,
  trendDirection,
  trendLabel,
  trendPositiveWhen,
  href,
  ariaLabel,
}: KpiCardProps) {
  const styles = TONE_STYLES[tone];

  const inner = (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
            styles.icon
          )}
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={2.25} />
        </div>
        {trendDirection && trendLabel && (
          <TrendPill
            direction={trendDirection}
            label={trendLabel}
            positiveWhen={trendPositiveWhen}
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <p
          className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight"
          dir="ltr"
          style={{ fontFeatureSettings: '"lnum", "tnum"' }}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="mt-auto -mx-1" style={{ color: styles.spark }}>
          <MiniSparkline
            values={sparkline}
            color={styles.spark}
            width={140}
            height={32}
            ariaLabel={ariaLabel}
          />
        </div>
      )}
    </div>
  );

  const baseCx = cn(
    'group surface-card-elevated hover-lift transition-smooth',
    'p-4 md:p-5 min-h-[120px] md:min-h-[140px]',
    'flex flex-col',
    styles.ring
  );

  if (href) {
    return (
      <Link href={href} className={baseCx} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={baseCx} role="group" aria-label={ariaLabel}>
      {inner}
    </div>
  );
}
