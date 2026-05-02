'use client';

/**
 * ArchiveCard — بطاقة وثيقة في الأرشيف
 *
 * تعرض: title + category + description + tags + expiry + size + actions
 */

import { useTranslations } from 'next-intl';
import {
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useFormat } from '@/shared/hooks/useFormat';
import { cn } from '@/shared/lib/utils';
import type { ArchiveItemView } from '../api/repository';

interface ArchiveCardProps {
  item: ArchiveItemView;
  onDelete: (item: ArchiveItemView) => void;
  isDeleting?: boolean;
}

export function ArchiveCard({ item, onDelete, isDeleting }: ArchiveCardProps) {
  const t = useTranslations('archive');
  const tCat = useTranslations('archive.categories');
  const tc = useTranslations('common');
  const f = useFormat();

  const isImage = item.mimeType.startsWith('image/');
  const Icon = isImage ? ImageIcon : FileText;

  const expiringSoon =
    item.daysUntilExpiry !== null &&
    item.daysUntilExpiry >= 0 &&
    item.daysUntilExpiry <= 30;
  const expired =
    item.daysUntilExpiry !== null && item.daysUntilExpiry < 0;

  return (
    <article className="surface-card-elevated hover-lift transition-smooth p-4 flex flex-col gap-3">
      <header className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
            'bg-info/10 text-info'
          )}
          aria-hidden="true"
        >
          <Icon size={18} strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tCat(categoryKey(item.category))}
          </p>
        </div>
      </header>

      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}

      {/* الوسوم */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="trend-pill bg-muted/40 text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* تنبيه الانتهاء */}
      {(expired || expiringSoon) && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs',
            expired
              ? 'bg-destructive/10 text-destructive'
              : 'bg-warning/10 text-warning'
          )}
        >
          <AlertTriangle size={12} aria-hidden="true" />
          <span>
            {expired
              ? t('expired')
              : t('expiresIn', { days: item.daysUntilExpiry ?? 0 })}
          </span>
        </div>
      )}

      <footer className="flex items-center gap-2 pt-2 border-t border-border">
        <div
          className="flex-1 min-w-0 text-xs text-muted-foreground tabular-nums"
          dir="ltr"
          style={{ fontFeatureSettings: '"lnum", "tnum"' }}
        >
          <div className="flex items-center gap-1.5">
            <Calendar size={12} aria-hidden="true" />
            <span>{f.shortDate(item.documentDate ?? item.uploadedAt)}</span>
            <span>·</span>
            <span>{f.compact(item.fileSize)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {item.signedUrl && (
            <a
              href={item.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-info hover:bg-info/10 transition-smooth"
              aria-label={tc('viewDetails')}
            >
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={isDeleting}
            className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth disabled:opacity-50"
            aria-label={tc('delete')}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </article>
  );
}

function categoryKey(c: string): 'invoice' | 'contract' | 'insurance' | 'government' | 'medical' | 'education' | 'property' | 'vehicle' | 'other' {
  return c.toLowerCase() as ReturnType<typeof categoryKey>;
}
