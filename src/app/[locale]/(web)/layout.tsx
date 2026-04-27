/**
 * (web) Layout — يلف كل صفحات التطبيق المحمية
 * يستخدم AppLayout: Sidebar (lg+) + Bottom Nav (<lg)
 * Server Component — لا 'use client'
 */

import { AppLayout } from '@/shared/components/layout';

interface WebLayoutProps {
  children: React.ReactNode;
}

export default function WebLayout({ children }: WebLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
