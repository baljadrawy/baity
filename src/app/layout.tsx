/**
 * Root Layout — "بيتي"
 *
 * يعيد children فقط بدون html/body — لأن [locale]/layout.tsx
 * يتولّى رسم <html lang dir> و <body> ديناميكياً حسب اللغة.
 *
 * Next.js يسمح لـ root layout بإرجاع children بدون html/body
 * إذا كان هناك layout فرعي يفعل ذلك.
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'بيتي — إدارة المنزل العائلي',
    template: '%s | بيتي',
  },
  description: 'منصة سعودية لإدارة شؤون البيت — فواتير، مهام، مشتريات، واقتصاد تربوي للأطفال',
  keywords: ['إدارة المنزل', 'فواتير', 'مهام منزلية', 'تربية مالية', 'عائلة'],
  authors: [{ name: 'بيتي' }],
  creator: 'بيتي',
  applicationName: 'بيتي',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    title: 'بيتي — إدارة المنزل العائلي',
    description: 'منصة سعودية لإدارة شؤون البيت بهوية عربية أصيلة',
    siteName: 'بيتي',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#c9a961',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
