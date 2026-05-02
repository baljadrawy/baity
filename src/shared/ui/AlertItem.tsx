/**
 * AlertItem — صف تنبيه/تذكير في قائمة الـ Alerts
 * Server Component — كل النصوص جاهزة من الـ caller
 */

import Link from 'next/link';
import { AlertTriangle, Bell, Clock, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertKind = 'bill' | 'chore' | 'warranty' | 'general';

const SEVERITY_STYLES: Record<AlertSeverity, { dot: string; icon: string; bar: string }> = {
  critical: {
    dot: 'bg-destructive',
    icon: 'bg-destructive/10 text-destructive',
    bar: 'bg-destructive',
  },
  warning: {
    dot: 'bg-warning',
    icon: 'bg-warning/10 text-warning',
    bar: 'bg-warning',
  },
  info: {
    dot: 'bg-info',
    icon: 'bg-info/10 text-info',
    bar: 'bg-info',
  },
};

const KIND_ICON: Record<AlertKind, LucideIcon> = {
  bill: AlertTriangle,
  chore: Clock,
  warranty: Shield,
  general: Bell,
};

interface AlertItemProps {
  message: string;
  /** نص فرعي مساعد (تاريخ، مبلغ، إلخ) — جاهز ومُنسَّق */
  meta?: string;
  severity: AlertSeverity;
  kind?: AlertKind;
  href?: string;
}

export function AlertItem({ message, meta, severity, kind = 'general', href }: AlertItemProps) {
  const styles = SEVERITY_STYLES[severity];
  const Icon = KIND_ICON[kind];

  const content = (
    <div className="flex items-start gap-3 p-3 rounded-xl transition-smooth hover:bg-accent/40">
      <span
        className={cn('inline-block w-1 self-stretch rounded-full flex-shrink-0', styles.bar)}
        aria-hidden="true"
      />
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0',
          styles.icon
        )}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2">{message}</p>
        {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block min-h-[44px]">
        {content}
      </Link>
    );
  }

  return <div className="min-h-[44px]">{content}</div>;
}
