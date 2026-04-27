/**
 * StatCard — بطاقة إحصاء للـ Dashboard
 * Mobile-first
 */

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const colorMap = {
  default: 'bg-card border-border',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
  error: 'bg-error/5 border-error/20',
  info: 'bg-info/5 border-info/20',
};

const iconBgMap = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
};

export function StatCard({ icon, label, value, sub, color = 'default' }: StatCardProps) {
  return (
    <div
      className={[
        'flex items-center gap-4 rounded-2xl border p-4 transition-shadow hover:shadow-sm',
        colorMap[color],
      ].join(' ')}
    >
      <div
        className={[
          'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl',
          iconBgMap[color],
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-foreground font-mono leading-tight mt-0.5" dir="ltr">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
