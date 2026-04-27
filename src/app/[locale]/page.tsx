import { redirect } from 'next/navigation';

/**
 * [locale]/ — يحوّل للـ dashboard
 * مثال: /ar → /ar/dashboard
 */
interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}
