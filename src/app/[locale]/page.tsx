import { redirect } from 'next/navigation';
import { getServerSession } from '@/core/auth/server-session';

/**
 * [locale]/ — يحوّل حسب دور المستخدم:
 *  - CHILD → /child/menu (واجهة طفولية)
 *  - الباقي → /dashboard
 */
interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession();
  const target = session?.role === 'CHILD' ? 'child/menu' : 'dashboard';
  redirect(`/${locale}/${target}`);
}
