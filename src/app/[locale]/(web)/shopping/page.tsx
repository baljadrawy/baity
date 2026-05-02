import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from '@/core/auth/server-session';
import { ShoppingPageClient } from './ShoppingPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shopping');
  return { title: t('title') };
}

export default async function ShoppingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);
  return <ShoppingPageClient householdId={session.householdId} />;
}
