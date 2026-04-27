'use client';

/**
 * ApplianceCard — بطاقة جهاز منزلي
 *
 * تعرض: اسم + ماركة + حالة الضمان + تنبيه الانتهاء
 * Mobile-first، touch ≥44px
 */

import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { Shield, ShieldAlert, ShieldOff, Wrench, ChevronLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ApplianceWithMeta } from '../api/repository';

const WARRANTY_CONFIG = {
  active:        { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', Icon: Shield },
  expiring_soon: { color: 'text-amber-600  dark:text-amber-400',   bg: 'bg-amber-50   dark:bg-amber-950/30',   Icon: ShieldAlert },
  expired:       { color: 'text-red-600    dark:text-red-400',     bg: 'bg-red-50     dark:bg-red-950/30',     Icon: ShieldOff },
  none:          { color: 'text-muted-foreground',                  bg: 'bg-muted/50',                          Icon: Shield },
} as const;

interface ApplianceCardProps {
  appliance: ApplianceWithMeta;
  onClick?: (appliance: ApplianceWithMeta) => void;
}

export function ApplianceCard({ appliance, onClick }: ApplianceCardProps) {
  const tw = useTranslations('warranty');
  const f = useFormat();

  const cfg = WARRANTY_CONFIG[appliance.warrantyStatus];
  const { Icon } = cfg;

  const upcomingMaintenance = appliance.maintenanceSchedules.find(
    (s) => s.isActive && new Date(s.nextDueAt) <= new Date(Date.now() + 7 * 86400000)
  );

  return (
    <article
      className={cn(
        'bg-card border border-border rounded-2xl p-4 space-y-3',
        'hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer'
      )}
      onClick={() => onClick?.(appliance)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(appliance)}
    >
      {/* الرأس */}
      <div className="flex items-start gap-3">
        <span className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
          <Icon className={cn('w-5 h-5', cfg.color)} aria-hidden />
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{appliance.name}</h3>
          {(appliance.brand || appliance.model) && (
            <p className="text-xs text-muted-foreground">
              {[appliance.brand, appliance.model].filter(Boolean).join(' — ')}
            </p>
          )}
          {appliance.location && (
            <p className="text-xs text-muted-foreground">{appliance.location}</p>
          )}
        </div>

        {onClick && <ChevronLeft className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" aria-hidden />}
      </div>

      {/* حالة الضمان */}
      <div className={cn('flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg', cfg.bg)}>
        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', cfg.color)} aria-hidden />
        <span className={cfg.color}>
          {appliance.warrantyStatus === 'none'
            ? tw('expired')
            : appliance.warrantyStatus === 'expired'
            ? tw('expired')
            : appliance.warrantyStatus === 'expiring_soon'
            ? tw('expiresIn', { days: appliance.warrantyDaysLeft ?? 0 })
            : appliance.warrantyEnd
            ? tw('validUntil', { date: f.date(appliance.warrantyEnd) })
            : tw('active')}
        </span>
      </div>

      {/* تنبيه صيانة قادمة */}
      {upcomingMaintenance && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <Wrench className="w-3.5 h-3.5" aria-hidden />
          <span>{upcomingMaintenance.taskName}</span>
        </div>
      )}

      {/* السعر + التاريخ */}
      {appliance.purchasePrice && (
        <p className="text-xs text-muted-foreground" dir="ltr">
          {f.currency(Number(appliance.purchasePrice))}
          {appliance.purchaseDate && ` · ${f.date(appliance.purchaseDate)}`}
        </p>
      )}
    </article>
  );
}
