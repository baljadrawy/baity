/**
 * صفحة إدارة الأعضاء — /settings/members
 * Server Component يجلب جلسة المستخدم ويمرّرها للجزء التفاعلي
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/core/auth/server-session';
import { MembersPageClient } from './MembersPageClient';

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const canManage = session.role === 'OWNER' || session.role === 'ADMIN';

  return (
    <MembersPageClient
      currentMemberId={session.memberId}
      canManage={canManage}
    />
  );
}
