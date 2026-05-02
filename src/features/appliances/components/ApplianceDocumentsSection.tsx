'use client';

/**
 * ApplianceDocumentsSection — قسم وثائق الجهاز (داخل dialog التعديل)
 *
 * - عرض قائمة الوثائق الموجودة (مع signed URLs للمعاينة)
 * - رفع وثيقة جديدة (image/pdf) مع اختيار النوع
 * - حذف وثيقة
 */

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Loader2,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useFormat } from '@/shared/hooks/useFormat';
import { useUploadFile } from '@/shared/hooks/useUploadFile';
import { ApiError } from '@/shared/lib/api-client';
import {
  useApplianceDocuments,
  useAddApplianceDocument,
  useDeleteApplianceDocument,
  type DocumentType,
  type ApplianceDocument,
} from '../hooks/useApplianceDocuments';

interface ApplianceDocumentsSectionProps {
  applianceId: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'PURCHASE_INVOICE',
  'WARRANTY_CARD',
  'USER_MANUAL',
  'RECEIPT',
  'SERVICE_REPORT',
  'PRODUCT_PHOTO',
  'OTHER',
];

const ACCEPTED_MIME = 'image/jpeg,image/png,image/webp,application/pdf';

export function ApplianceDocumentsSection({ applianceId }: ApplianceDocumentsSectionProps) {
  const t = useTranslations('warranty');
  const tt = useTranslations('warranty.documentTypes');
  const tc = useTranslations('common');
  const f = useFormat();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<DocumentType>('PURCHASE_INVOICE');
  const [serverError, setServerError] = useState<string | null>(null);

  const { data, isLoading } = useApplianceDocuments(applianceId);
  const uploadMutation = useUploadFile();
  const addMutation = useAddApplianceDocument(applianceId);
  const deleteMutation = useDeleteApplianceDocument(applianceId);

  const docs = data?.data ?? [];
  const isUploading = uploadMutation.isPending || addMutation.isPending;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setServerError(null);

    try {
      // 1. ارفع الملف للـ Storage
      const uploadRes = await uploadMutation.mutateAsync({
        file,
        category: 'appliances',
      });

      // 2. سجِّل الـ document في DB
      await addMutation.mutateAsync({
        type: pendingType,
        title: tt(typeKey(pendingType)),
        filePath: uploadRes.path,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.size,
        mimeType: uploadRes.mimeType,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err.data as { error?: string } | undefined)?.error;
        if (code === 'file_too_large') setServerError(t('errors.fileTooLarge'));
        else if (code === 'unsupported_mime') setServerError(t('errors.unsupportedMime'));
        else if (code === 'invalid_file') setServerError(t('errors.invalidFile'));
        else setServerError(t('errors.uploadFailed'));
      } else {
        setServerError(t('errors.uploadFailed'));
      }
    } finally {
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (doc: ApplianceDocument) => {
    const confirmed = window.confirm(t('deleteConfirm', { name: doc.fileName }));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(doc.id);
    } catch (err) {
      console.error('delete document failed', err);
    }
  };

  return (
    <section className="flex flex-col gap-3 pt-4 border-t border-border">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t('documents', { count: docs.length })}
        </h3>
      </header>

      {/* اختيار النوع + زر الرفع */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={pendingType}
          onChange={(e) => setPendingType(e.target.value as DocumentType)}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]"
          disabled={isUploading}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {tt(typeKey(type))}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth min-h-[44px]"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {t('uploadDocument')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {serverError && (
        <p className="rounded-xl bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive">
          {serverError}
        </p>
      )}

      {/* قائمة الوثائق */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">{tc('loading')}</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {docs.map((doc) => {
            const isImage = doc.mimeType.startsWith('image/');
            const Icon = isImage ? ImageIcon : FileText;
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-smooth"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info flex-shrink-0"
                  aria-hidden="true"
                >
                  <Icon size={16} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p
                    className="text-xs text-muted-foreground tabular-nums"
                    dir="ltr"
                    style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                  >
                    {f.compact(doc.fileSize)} · {f.shortDate(doc.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {doc.signedUrl && (
                    <a
                      href={doc.signedUrl}
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
                    onClick={() => handleDelete(doc)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth disabled:opacity-50"
                    aria-label={tc('delete')}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** map enum value → i18n key (lowercase snake) */
function typeKey(t: DocumentType): 'purchase_invoice' | 'warranty_card' | 'user_manual' | 'receipt' | 'service_report' | 'product_photo' | 'other' {
  return t.toLowerCase() as ReturnType<typeof typeKey>;
}
