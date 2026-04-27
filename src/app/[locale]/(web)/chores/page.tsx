/**
 * صفحة المهام الدورية — /[locale]/chores
 */

import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ChoresPageClient } from './ChoresPageClient';
import { PageLoader } from '@/shared/components/PageLoader';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chores' });
  return { title: t('title') };
}

export default async function ChoresPage() {
  const t = await getTranslations('chores');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
      </div>

      <Suspense fallback={<PageLoader />}>
        <ChoresPageClient />
      </Suspense>
    </div>
  );
}
