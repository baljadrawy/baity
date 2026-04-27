/**
 * ResponsiveDialog — حوار متجاوب
 * - جوال (< md): Sheet من الأسفل (full-width)
 * - ديسكتوب (md+): Dialog مركزي
 *
 * الاستخدام:
 * <ResponsiveDialog open={open} onOpenChange={setOpen} title="عنوان">
 *   <p>محتوى الحوار</p>
 * </ResponsiveDialog>
 */

'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** تجاوز: عرض مخصص للـ dialog (md+) */
  maxWidth?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: ResponsiveDialogProps) {
  const t = useTranslations('common');
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // إغلاق بضغط Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // منع التمرير خلف الـ dialog
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog / Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={[
          'fixed z-50 bg-card shadow-xl',
          // جوال: Sheet من الأسفل
          'bottom-0 start-0 end-0 rounded-t-2xl',
          // ديسكتوب: Dialog مركزي
          `md:bottom-auto md:start-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:w-full ${maxWidth}`,
          // RTL: نعكس translate-x
          'md:rtl:translate-x-1/2',
        ].join(' ')}
        style={{ maxHeight: 'calc(90svh - env(safe-area-inset-bottom))' }}
      >
        {/* رأس الحوار */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="dialog-title" className="text-base font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p id="dialog-description" className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={t('close')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* محتوى الحوار */}
        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(80svh - 80px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
