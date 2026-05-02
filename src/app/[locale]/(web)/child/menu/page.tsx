/**
 * صفحة منيو الأعمال للطفل — /child/menu
 * Server Component — auth gate
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/core/auth/server-session';
import { ChildMenuPageClient } from './ChildMenuPageClient';

export default async function ChildMenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  return (
    <ChildMenuPageClient
      memberId={session.memberId}
      childName={session.name}
      isChild={session.role === 'CHILD'}
    />
  );
}
