/**
 * AppLayout — الهيكل الكامل للتطبيق
 *
 * ───────────────────────────────────────────────
 * Desktop (lg+):
 * ┌──────────┬──────────────────────────────────┐
 * │ Sidebar  │ Header                           │
 * │          ├──────────────────────────────────┤
 * │          │ Main Content (scrollable)        │
 * └──────────┴──────────────────────────────────┘
 *
 * Mobile/Tablet (< lg):
 * ┌──────────────────────────────────────────────┐
 * │ Header                                       │
 * ├──────────────────────────────────────────────┤
 * │ Main Content (scrollable)                    │
 * ├──────────────────────────────────────────────┤
 * │ Bottom Navigation (fixed)                    │
 * └──────────────────────────────────────────────┘
 * ───────────────────────────────────────────────
 */

import { getServerSession } from '@/core/auth/server-session';
import { isSuperAdminUser } from '@/core/auth/super-admin';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export async function AppLayout({ children, title }: AppLayoutProps) {
  const session = await getServerSession();
  const isAdmin = session ? await isSuperAdminUser(session.userId) : false;

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Sidebar — Desktop فقط */}
      <AppSidebar isAdmin={isAdmin} />

      {/* المنطقة الرئيسية */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <AppHeader title={title} />

        {/* المحتوى الرئيسي */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))',
          }}
          tabIndex={-1}
        >
          {/* Container متجاوب */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation — Mobile/Tablet فقط */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
