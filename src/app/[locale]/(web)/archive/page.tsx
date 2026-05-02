/**
 * صفحة الأرشيف العام — /archive
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/core/auth/server-session';
import { ArchivePageClient } from './ArchivePageClient';

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  return <ArchivePageClient />;
}
