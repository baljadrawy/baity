'use client';

/**
 * HelpTooltip — أيقونة (ⓘ) مع tooltip للحقول المربكة
 *
 * الاستخدام:
 *   <HelpTooltip text="شرح مختصر للحقل" />
 *   <HelpTooltip text="..." iconSize={14} />
 *
 * UX:
 * - hover (ديسكتوب) → يظهر التلميح
 * - tap (جوال) → toggle
 * - Escape يغلق
 * - يدعم RTL تلقائياً
 */

import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface HelpTooltipProps {
  /** نص الشرح (مُترجَم — يُمرَّر من الـ caller) */
  text: string;
  /** ARIA label للأيقونة (مُترجَم) */
  ariaLabel: string;
  iconSize?: number;
  className?: string;
}

export function HelpTooltip({
  text,
  ariaLabel,
  iconSize = 14,
  className,
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // إغلاق بـ Escape أو click خارج
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (
        tooltipRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-info focus:text-info transition-smooth min-h-[24px] min-w-[24px] p-1 -m-1"
      >
        <Info size={iconSize} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'absolute z-50 max-w-[260px] sm:max-w-xs',
            'rounded-xl bg-foreground text-background',
            'px-3 py-2 text-xs leading-relaxed',
            'shadow-lg pointer-events-auto',
            // يظهر تحت الأيقونة، يحاذى للبداية (RTL/LTR aware)
            'top-full mt-2 start-0'
          )}
        >
          {text}
        </div>
      )}
    </span>
  );
}
