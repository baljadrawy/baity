import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ShoppingPageClient } from './ShoppingPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shopping');
  return { title: t('title') };
}

export default function ShoppingPage() {
  return <ShoppingPageClient />;
}
