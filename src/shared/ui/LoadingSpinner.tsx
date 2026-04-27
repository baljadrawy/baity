/**
 * LoadingSpinner — مؤشر التحميل
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={[
        'animate-spin rounded-full border-border border-t-primary',
        sizes[size],
        className,
      ].join(' ')}
      role="status"
      aria-label="loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
