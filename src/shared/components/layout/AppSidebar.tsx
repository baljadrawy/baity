/**
 * AppSidebar — الشريط الجانبي للتصفح (Desktop lg+)
 * يظهر فقط على lg+ (hidden على الجوال والتابلت portrait)
 * Mobile-first: hidden lg:flex
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
  Tv2,
  Wallet,
  Landmark,
  Archive,
  HelpCircle,
  Settings,
  LogOut,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'bills', href: '/bills', icon: Receipt },
  { key: 'chores', href: '/chores', icon: ClipboardList },
  { key: 'shopping', href: '/shopping', icon: ShoppingCart },
  { key: 'appliances', href: '/appliances', icon: Tv2 },
  { key: 'wallet', href: '/house-economy', icon: Wallet },
  { key: 'familyBank', href: '/family-bank', icon: Landmark },
  { key: 'archive', href: '/archive', icon: Archive },
];

export function AppSidebar() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`);

  return (
    <aside
      className="hidden lg:flex flex-col h-full bg-card border-e border-border"
      style={{ width: 'var(--sidebar-width)' }}
      aria-label={t('sidebar')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg flex-shrink-0"
          aria-hidden="true"
        >
          🏠
        </div>
        <span className="text-lg font-bold text-foreground">{t('appName')}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={t('mainNav')}>
        <ul className="flex flex-col gap-1" role="list">
          {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={key}>
                <Link
                  href={`/${locale}${href}`}
                  className={[
                    'group relative flex items-center gap-3 rounded-xl px-3 min-h-[44px]',
                    'text-sm font-medium transition-smooth',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && <span className="nav-active-indicator" aria-hidden="true" />}
                  <Icon
                    size={20}
                    aria-hidden="true"
                    strokeWidth={active ? 2.25 : 2}
                  />
                  {t(key as Parameters<typeof t>[0])}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: Help + Settings + Logout */}
      <div className="px-3 py-4 border-t border-border flex flex-col gap-1">
        <Link
          href={`/${locale}/help`}
          className="flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-smooth"
        >
          <HelpCircle size={20} aria-hidden="true" />
          {t('help')}
        </Link>
        <Link
          href={`/${locale}/settings`}
          className="flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-smooth"
        >
          <Settings size={20} aria-hidden="true" />
          {t('settings')}
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}

function LogoutButton() {
  const t = useTranslations('navigation');

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 rounded-xl px-3 min-h-[44px] w-full text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
    >
      <LogOut size={20} aria-hidden="true" />
      {t('logout')}
    </button>
  );
}
