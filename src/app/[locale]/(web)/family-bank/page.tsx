/**
 * صفحة بنك العائلة — /family-bank
 * Server Component — يفحص الـ session ثم يمرّر للـ client
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/core/auth/server-session';
import { FamilyBankPageClient } from './FamilyBankPageClient';

export default async function FamilyBankPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  return <FamilyBankPageClient />;
}
