/**
 * DashboardSection — حاوية موحّدة لأقسام الـ dashboard
 * - رأس مع عنوان + وصف فرعي + رابط "عرض الكل"
 * - body بـ surface-card-elevated
 *
 * Server Component
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface DashboardSectionProps {
  title: string;
  description?: string;
  /** زر "عرض الكل" — href + label */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** عناصر إضافية في الرأس (مثل toggle أو badge) */
  headerExtra?: React.ReactNode;
  /** بدون padding داخلي — مفيد للـ widgets الموجودة */
  noPadding?: boolean;
  /** ارتفاع أدنى للحاوية */
  minHeight?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  /** ARIA label على الـ section */
  ariaLabel?: string;
}

export function DashboardSection({
  title,
  description,
  viewAllHref,
  viewAllLabel,
  headerExtra,
  noPadding = false,
  minHeight,
  className,
  bodyClassName,
  children,
  ariaLabel,
}: DashboardSectionProps) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className={cn('surface-card-elevated flex flex-col', className)}
      style={minHeight ? { minHeight } : undefined}
    >
      <header className="flex items-center justify-between gap-3 p-4 md:p-5 pb-3">
        <div className="min-w-0 flex flex-col gap-0.5">
          <h2 className="text-base md:text-lg font-semibold text-foreground truncate">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerExtra}
          {viewAllHref && viewAllLabel && (
            <Link
              href={viewAllHref}
              className={cn(
                'inline-flex items-center gap-1 text-xs md:text-sm font-medium',
                'text-primary hover:underline underline-offset-2',
                'min-h-[44px] px-2 transition-smooth'
              )}
            >
              {viewAllLabel}
              <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
            </Link>
          )}
        </div>
      </header>
      <div
        className={cn(
          'flex-1',
          !noPadding && 'p-4 md:p-5 pt-0',
          bodyClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
