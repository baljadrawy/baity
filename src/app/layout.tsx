/**
 * Root Layout — "بيتي"
 * هذا الـ layout الجذر يُحدَّد فيه الـ charset والـ viewport فقط.
 * اللغة والاتجاه يُحدَّدان في [locale]/layout.tsx
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
  viewportFit: 'cover', // لـ iPhone notch
  themeColor: '#c9a961',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang و dir يُحدَّدان في [locale]/layout.tsx ديناميكياً
    // هنا نضع placeholder فقط — next-intl سيتولّى الباقي
    <html suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
