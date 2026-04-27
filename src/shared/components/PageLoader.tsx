/**
 * PageLoader — مؤشر تحميل الصفحة الكاملة
 */

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]" role="status" aria-label="جاري التحميل">
      <div className="flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  );
}
