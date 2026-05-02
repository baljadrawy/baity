'use client';

/**
 * ArchiveUploadDialog — حوار رفع وثيقة جديدة للأرشيف
 *
 * 1. اختر ملف (image/pdf)
 * 2. اختر الفئة + اكتب title + (اختياري) description + expiryDate + tags
 * 3. زر الرفع: يستدعي /api/v1/upload ثم /api/v1/archive
 */

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Upload, FileText } from 'lucide-react';
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog';
import { useUploadFile } from '@/shared/hooks/useUploadFile';
import { useCreateArchive } from '../hooks/useArchive';
import { ARCHIVE_CATEGORIES, type ArchiveCategory } from '../schemas';
import { ApiError } from '@/shared/lib/api-client';

interface ArchiveUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

const ACCEPTED_MIME = 'image/jpeg,image/png,image/webp,application/pdf';

export function ArchiveUploadDialog({ open, onClose }: ArchiveUploadDialogProps) {
  const t = useTranslations('archive');
  const tCat = useTranslations('archive.categories');
  const tc = useTranslations('common');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<ArchiveCategory>('INVOICE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const upload = useUploadFile();
  const create = useCreateArchive();
  const isPending = upload.isPending || create.isPending;

  const reset = () => {
    setFile(null);
    setCategory('INVOICE');
    setTitle('');
    setDescription('');
    setExpiryDate('');
    setTagsInput('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError(t('errors.fileRequired'));
      return;
    }
    if (!title.trim()) {
      setError(tc('required'));
      return;
    }

    try {
      // 1. رفع الملف
      const uploadRes = await upload.mutateAsync({ file, category: 'documents' });

      // 2. تسجيل الـ archive entry
      const tags = tagsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);

      await create.mutateAsync({
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        filePath: uploadRes.path,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.size,
        mimeType: uploadRes.mimeType,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      reset();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err.data as { error?: string } | undefined)?.error;
        if (code === 'file_too_large') setError(t('errors.fileTooLarge'));
        else if (code === 'unsupported_mime') setError(t('errors.unsupportedMime'));
        else if (code === 'invalid_file') setError(t('errors.invalidFile'));
        else setError(t('errors.uploadFailed'));
      } else {
        setError(t('errors.uploadFailed'));
      }
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
      title={t('uploadTitle')}
      description={t('uploadDesc')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* اختيار الملف */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t('form.file')} <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-4 text-sm hover:bg-muted/30 transition-smooth min-h-[60px]"
          >
            {file ? (
              <>
                <FileText className="h-4 w-4 text-info" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">{t('form.filePlaceholder')}</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* الفئة */}
          <div>
            <label htmlFor="archive-category" className="block text-sm font-medium text-foreground mb-1.5">
              {t('form.category')} <span className="text-destructive">*</span>
            </label>
            <select
              id="archive-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ArchiveCategory)}
              disabled={isPending}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]"
            >
              {ARCHIVE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tCat(c.toLowerCase() as 'invoice')}
                </option>
              ))}
            </select>
          </div>

          {/* تاريخ الانتهاء */}
          <div>
            <label htmlFor="archive-expiry" className="block text-sm font-medium text-foreground mb-1.5">
              {t('form.expiryDate')}
            </label>
            <input
              id="archive-expiry"
              type="date"
              dir="ltr"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]"
            />
          </div>

          {/* العنوان */}
          <div className="md:col-span-2">
            <label htmlFor="archive-title" className="block text-sm font-medium text-foreground mb-1.5">
              {t('form.title')} <span className="text-destructive">*</span>
            </label>
            <input
              id="archive-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              maxLength={200}
              disabled={isPending}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]"
            />
          </div>

          {/* الوصف */}
          <div className="md:col-span-2">
            <label htmlFor="archive-desc" className="block text-sm font-medium text-foreground mb-1.5">
              {t('form.description')}
            </label>
            <textarea
              id="archive-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              maxLength={1000}
              rows={2}
              disabled={isPending}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth resize-none"
            />
          </div>

          {/* الوسوم */}
          <div className="md:col-span-2">
            <label htmlFor="archive-tags" className="block text-sm font-medium text-foreground mb-1.5">
              {t('form.tags')}
            </label>
            <input
              id="archive-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={t('form.tagsPlaceholder')}
              disabled={isPending}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]"
            />
            <p className="text-xs text-muted-foreground mt-1">{t('form.tagsHint')}</p>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth min-h-[48px]"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {t('uploadAction')}
        </button>
      </form>
    </ResponsiveDialog>
  );
}
