/**
 * صفحة دليل الاستخدام — /help
 *
 * Server Component — كل النصوص من i18n (namespace `help.*`)
 * أقسام لكل ميزة + جدول محتويات + صفحة ودودة للقراءة على الجوال والديسكتوب
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  Users,
  Receipt,
  ClipboardList,
  ShoppingCart,
  Tv2,
  Wallet,
  Landmark,
  Archive,
  Bell,
  KeyRound,
  Send,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getServerSession } from '@/core/auth/server-session';
import { cn } from '@/shared/lib/utils';

interface HelpSection {
  id: string;
  icon: LucideIcon;
  tone: string;
  /** عدد الـ steps في القسم — يُستخدم للتلوين */
  stepsCount: number;
}

const SECTIONS: HelpSection[] = [
  { id: 'gettingStarted', icon: HelpCircle, tone: 'primary', stepsCount: 4 },
  { id: 'members', icon: Users, tone: 'info', stepsCount: 3 },
  { id: 'bills', icon: Receipt, tone: 'warning', stepsCount: 4 },
  { id: 'chores', icon: ClipboardList, tone: 'info', stepsCount: 5 },
  { id: 'shopping', icon: ShoppingCart, tone: 'success', stepsCount: 3 },
  { id: 'appliances', icon: Tv2, tone: 'primary', stepsCount: 4 },
  { id: 'archive', icon: Archive, tone: 'info', stepsCount: 3 },
  { id: 'houseEconomy', icon: Wallet, tone: 'success', stepsCount: 5 },
  { id: 'familyBank', icon: Landmark, tone: 'warning', stepsCount: 3 },
  { id: 'pin', icon: KeyRound, tone: 'info', stepsCount: 3 },
  { id: 'notifications', icon: Bell, tone: 'warning', stepsCount: 3 },
  { id: 'telegram', icon: Send, tone: 'info', stepsCount: 3 },
  { id: 'privacy', icon: ShieldCheck, tone: 'success', stepsCount: 4 },
];

const TONE_CLASSES: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations('help');

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* جدول المحتويات */}
      <nav
        aria-label={t('toc')}
        className="surface-card-elevated p-4 md:p-5"
      >
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          {t('toc')}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" role="list">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-accent/50 transition-smooth min-h-[44px]"
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0',
                      TONE_CLASSES[s.tone]
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={14} strokeWidth={2.25} />
                  </span>
                  <span className="text-foreground truncate">
                    {t(`sections.${s.id}.title`)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* الأقسام */}
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className="surface-card-elevated p-5 md:p-6 flex flex-col gap-4 scroll-mt-20"
          >
            <header className="flex items-start gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
                  TONE_CLASSES[section.tone]
                )}
                aria-hidden="true"
              >
                <Icon size={18} strokeWidth={2.25} />
              </span>
              <div className="flex-1 min-w-0">
                <h2
                  id={`${section.id}-title`}
                  className="text-lg md:text-xl font-bold text-foreground"
                >
                  {t(`sections.${section.id}.title`)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {t(`sections.${section.id}.intro`)}
                </p>
              </div>
            </header>

            <div className="flex flex-col gap-2 ps-1">
              <h3 className="text-sm font-semibold text-foreground">
                {t('howItWorks')}
              </h3>
              <ol className="flex flex-col gap-2" role="list">
                {Array.from({ length: section.stepsCount }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-foreground leading-relaxed"
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0',
                        'bg-muted text-muted-foreground text-xs font-bold tabular-nums'
                      )}
                      dir="ltr"
                      style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span>{t(`sections.${section.id}.steps.${i}`)}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-3 leading-relaxed">
              <strong className="text-foreground">{t('tip')}:</strong>{' '}
              {t(`sections.${section.id}.tip`)}
            </p>
          </section>
        );
      })}

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground">
        <p>
          {t('contact')}{' '}
          <Link
            href={`/${locale}/settings`}
            className="text-primary hover:underline underline-offset-2"
          >
            {t('contactCta')}
          </Link>
        </p>
      </footer>
    </div>
  );
}
