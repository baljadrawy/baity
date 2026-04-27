import { redirect } from 'next/navigation';

/**
 * الصفحة الجذر — تحوّل تلقائياً للغة العربية
 * next-intl middleware سيتولّى هذا أيضاً، لكن هذا كـ fallback
 */
export default function RootPage() {
  redirect('/ar');
}
