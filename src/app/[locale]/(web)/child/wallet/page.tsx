/**
 * صفحة محفظة الطفل — /child/wallet
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/core/auth/server-session';
import { ChildWalletPageClient } from './ChildWalletPageClient';

export default async function ChildWalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  return <ChildWalletPageClient memberId={session.memberId} childName={session.name} />;
}
