/**
 * BottomNav — شريط التنقل السفلي (Mobile/Tablet < lg)
 *
 * 4 روابط رئيسية + زر "المزيد" يفتح bottom sheet بكل الروابط الثانوية:
 * الأجهزة، بنك العائلة، الأرشيف، اقتصاد البيت، الدليل، الإعدادات.
 *
 * Touch targets ≥ 60px (Apple HIG).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Receipt,
  ClipboardList,
  ShoppingCart,
  Wallet,
  Tv2,
  Landmark,
  Archive,
  HelpCircle,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
}

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'bills', href: '/bills', icon: Receipt },
  { key: 'chores', href: '/chores', icon: ClipboardList },
  { key: 'shopping', href: '/shopping', icon: ShoppingCart },
];

const MORE_ITEMS: NavItem[] = [
  { key: 'wallet', href: '/house-economy', icon: Wallet },
  { key: 'familyBank', href: '/family-bank', icon: Landmark },
  { key: 'appliances', href: '/appliances', icon: Tv2 },
  { key: 'archive', href: '/archive', icon: Archive },
  { key: 'help', href: '/help', icon: HelpCircle },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`);

  // هل الصفحة الحالية في الـ "more" sheet؟
  const moreActive = MORE_ITEMS.some((it) => isActive(it.href));

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 start-0 end-0 z-40 bg-card border-t border-border"
        style={{
          height: 'var(--bottom-nav-height)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label={t('bottomNav')}
      >
        <ul className="flex h-full items-center" role="list">
          {BOTTOM_NAV_ITEMS.map(({ key, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={key} className="flex-1">
                <Link
                  href={`/${locale}${href}`}
                  className={[
                    'flex flex-col items-center justify-center gap-1',
                    'min-h-[60px] w-full text-[10px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    size={22}
                    aria-hidden="true"
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                  <span>{t(key as Parameters<typeof t>[0])}</span>
                </Link>
              </li>
            );
          })}

          {/* زر "المزيد" — يفتح sheet */}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={[
                'flex flex-col items-center justify-center gap-1',
                'min-h-[60px] w-full text-[10px] font-medium transition-colors',
                moreActive ? 'text-primary' : 'text-muted-foreground',
              ].join(' ')}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal
                size={22}
                aria-hidden="true"
                strokeWidth={moreActive ? 2.5 : 1.75}
              />
              <span>{t('more')}</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Bottom sheet للروابط الإضافية */}
      {moreOpen && (
        <>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            aria-label={t('closeMore')}
          />
          <div
            className="lg:hidden fixed bottom-0 start-0 end-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            role="menu"
            aria-label={t('more')}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {t('more')}
              </h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label={t('closeMore')}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <ul className="grid grid-cols-3 gap-2 p-4" role="list">
              {MORE_ITEMS.map(({ key, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={key}>
                    <Link
                      href={`/${locale}${href}`}
                      onClick={() => setMoreOpen(false)}
                      className={[
                        'flex flex-col items-center justify-center gap-2',
                        'min-h-[80px] w-full rounded-xl text-xs font-medium',
                        'transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/40 text-foreground hover:bg-muted',
                      ].join(' ')}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={24} aria-hidden="true" strokeWidth={2} />
                      <span className="text-center px-2 leading-tight">
                        {t(key as Parameters<typeof t>[0])}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
