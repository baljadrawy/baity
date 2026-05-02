/**
 * AiSummaryCard — كرت الملخّص الذكي (AI Insight)
 * Server Component — كل النصوص مُمرَّرة جاهزة من الـ caller
 *
 * يعرض: badge صغير + عنوان + 1-3 رؤى (insights) + زر "تفاصيل أكثر"
 */

import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface AiSummaryCardProps {
  badge: string;
  title: string;
  /** قائمة insights — كل عنصر نص جاهز بالـ locale الصحيح */
  insights: string[];
  /** نص الزر */
  viewMoreLabel?: string;
  /** رابط التفاصيل */
  viewMoreHref?: string;
  className?: string;
}

export function AiSummaryCard({
  badge,
  title,
  insights,
  viewMoreLabel,
  viewMoreHref,
  className,
}: AiSummaryCardProps) {
  return (
    <div
      className={cn(
        'ai-glow surface-card-elevated relative overflow-hidden',
        'p-5 md:p-6 flex flex-col gap-4',
        className
      )}
    >
      {/* Decorative gradient ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -end-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)',
        }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary"
            aria-hidden="true"
          >
            <Sparkles size={18} strokeWidth={2.25} />
          </div>
          <span className="trend-pill bg-primary/10 text-primary">{badge}</span>
        </div>
      </div>

      <div className="relative flex flex-col gap-2">
        <h3 className="text-base md:text-lg font-semibold text-foreground">{title}</h3>
        <ul className="flex flex-col gap-2" role="list">
          {insights.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed"
            >
              <span
                aria-hidden="true"
                className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/70"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {viewMoreHref && viewMoreLabel && (
        <div className="relative">
          <Link
            href={viewMoreHref}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium text-primary',
              'transition-smooth hover:gap-2.5 min-h-[44px]'
            )}
          >
            {viewMoreLabel}
            <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
          </Link>
        </div>
      )}
    </div>
  );
}
