import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HouseEconomyPageClient } from './HouseEconomyPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('houseEconomy');
  return { title: t('title') };
}

export default function HouseEconomyPage() {
  return <HouseEconomyPageClient />;
}
