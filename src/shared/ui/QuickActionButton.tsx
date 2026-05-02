/**
 * QuickActionButton — زر إجراء سريع مع أيقونة + label
 * Server Component (Link)
 */

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface QuickActionButtonProps {
  href: string;
  label: string;
  icon: LucideIcon;
  /** اللون الدلالي للأيقونة */
  tone?: 'primary' | 'success' | 'warning' | 'info';
}

const TONE_CLASSES: Record<NonNullable<QuickActionButtonProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

export function QuickActionButton({
  href,
  label,
  icon: Icon,
  tone = 'primary',
}: QuickActionButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group surface-card-elevated hover-lift transition-smooth',
        'flex items-center gap-3 p-3 md:p-4 min-h-[60px]'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
          TONE_CLASSES[tone]
        )}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
