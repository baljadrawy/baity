/**
 * BottomNav — شريط التنقل السفلي (Mobile/Tablet < lg)
 * يظهر فقط على الجوال والتابلت (lg:hidden)
 * 5 عناصر كحد أقصى — Touch targets ≥ 60px
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Receipt,
  ClipboardList,
  ShoppingCart,
  Wallet,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
}

// الجوال: 5 روابط رئيسية فقط
const BOTTOM_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'bills', href: '/bills', icon: Receipt },
  { key: 'chores', href: '/chores', icon: ClipboardList },
  { key: 'shopping', href: '/shopping', icon: ShoppingCart },
  { key: 'wallet', href: '/wallet', icon: Wallet },
];

export function BottomNav() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`);

  return (
    <nav
      className="lg:hidden fixed bottom-0 start-0 end-0 z-40 bg-card border-t border-border"
      style={{ height: 'var(--bottom-nav-height)', paddingBottom: 'env(safe-area-inset-bottom)' }}
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
      </ul>
    </nav>
  );
}
