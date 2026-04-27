/**
 * EmptyState — حالة الفراغ عند عدم وجود بيانات
 * Mobile-first، كل النصوص من i18n
 */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4">
      <span className="text-5xl" aria-hidden="true">{icon}</span>
      <div className="flex flex-col gap-2">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
