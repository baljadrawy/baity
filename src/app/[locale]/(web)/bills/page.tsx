/**
 * صفحة الفواتير — /[locale]/bills
 *
 * Server Component: يجلب الـ summary من DB مباشرة
 * Client: BillsList يتعامل مع الفلترة والتفاعل
 */

import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { BillsPageClient } from './BillsPageClient';
import { PageLoader } from '@/shared/components/PageLoader';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'bills' });
  return { title: t('title') };
}

export default async function BillsPage() {
  const t = await getTranslations('bills');

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* المحتوى التفاعلي */}
      <Suspense fallback={<PageLoader />}>
        <BillsPageClient />
      </Suspense>
    </div>
  );
}
