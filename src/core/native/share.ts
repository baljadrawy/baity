/**
 * Share Abstraction — المشاركة (Web → Capacitor)
 *
 * يعمل على الويب عبر Web Share API.
 * عند التغليف بـ Capacitor: @capacitor/share
 */

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * هل المشاركة مدعومة في هذه البيئة؟
 */
export function canShare(data?: ShareData): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  if (data?.files && !navigator.canShare?.({ files: data.files })) return false;
  return true;
}

/**
 * مشاركة محتوى — يستخدم Web Share API أو يفتح fallback
 */
export async function share(data: ShareData): Promise<'shared' | 'cancelled' | 'fallback'> {
  if (canShare(data)) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return 'shared';
    } catch (err) {
      // المستخدم ألغى المشاركة
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
      // فشل آخر — انتقل للـ fallback
    }
  }

  // Fallback: انسخ للحافظة
  if (data.url || data.text) {
    try {
      await navigator.clipboard.writeText(data.url ?? data.text ?? '');
      return 'fallback';
    } catch {
      // ignore
    }
  }

  return 'fallback';
}

/**
 * مشاركة فاتورة
 */
export async function shareBill(bill: {
  title: string;
  amount: number;
  dueDate: string;
}): Promise<void> {
  await share({
    title: `فاتورة: ${bill.title}`,
    text: `المبلغ: ${bill.amount} ر.س — الاستحقاق: ${bill.dueDate}`,
    url: window.location.href,
  });
}

/**
 * نسخ نص للحافظة مع fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback قديم
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  }
}
