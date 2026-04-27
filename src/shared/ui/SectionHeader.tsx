/**
 * SectionHeader — رأس القسم مع رابط "عرض الكل" اختياري
 */

import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function SectionHeader({ title, viewAllHref, viewAllLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="text-sm text-primary hover:underline underline-offset-2 min-h-[44px] flex items-center"
        >
          {viewAllLabel}
        </Link>
      )}
    </div>
  );
}
