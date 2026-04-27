/**
 * Telegram Bot — وحدة الإشعارات عبر تيليغرام
 *
 * يُرسل إشعارات نصية للأسرة عبر Telegram Bot API.
 * كل مستخدم يربط حسابه بالبوت للحصول على chatId الخاص به.
 *
 * المتغيرات البيئية المطلوبة:
 *   TELEGRAM_BOT_TOKEN — توكن البوت من @BotFather
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/** نوع الاستجابة من Telegram API */
interface TelegramResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
}

/**
 * يُرسل رسالة نصية لـ chatId محدد.
 * Returns true if sent successfully, false otherwise (non-throwing).
 */
export async function sendMessage(chatId: string, text: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set — skipping notification');
    return false;
  }

  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
      // Timeout via AbortSignal (Node 18+)
      signal: AbortSignal.timeout(10_000),
    });

    const json = (await res.json()) as TelegramResponse;
    if (!json.ok) {
      console.error(`[Telegram] sendMessage failed: ${json.description}`);
    }
    return json.ok;
  } catch (err) {
    console.error('[Telegram] sendMessage error:', err);
    return false;
  }
}

/**
 * يُرسل إشعاراً لعدة chatIds بالتوازي.
 */
export async function broadcastMessage(chatIds: string[], text: string): Promise<void> {
  await Promise.allSettled(chatIds.map((id) => sendMessage(id, text)));
}

// ─── قوالب الإشعارات ────────────────────────────────────────────────────────

/**
 * فاتورة مستحقة قريباً
 */
export function billDueTemplate(billName: string, days: number, amount: number): string {
  const daysText = days === 0 ? 'اليوم' : `خلال ${days} يوم`;
  return `🔔 <b>تذكير بالفاتورة</b>\n\nفاتورة <b>${billName}</b> مستحقة ${daysText}\nالمبلغ: <b>${amount.toFixed(2)} ر.س</b>`;
}

/**
 * فاتورة متأخرة
 */
export function billOverdueTemplate(billName: string, days: number): string {
  return `⚠️ <b>فاتورة متأخرة</b>\n\nفاتورة <b>${billName}</b> متأخرة منذ ${days} يوم\nيُرجى السداد في أقرب وقت`;
}

/**
 * مهمة أُسندت لعضو
 */
export function choreAssignedTemplate(choreName: string, memberName: string): string {
  return `📋 <b>مهمة جديدة</b>\n\nأهلاً <b>${memberName}</b>،\nلديك مهمة جديدة: <b>${choreName}</b>`;
}

/**
 * مهمة متأخرة
 */
export function choreOverdueTemplate(choreName: string): string {
  return `⏰ <b>مهمة متأخرة</b>\n\nمهمة <b>${choreName}</b> متأخرة — يرجى الإنجاز في أقرب وقت`;
}

/**
 * عمل طفل تمت الموافقة عليه
 */
export function jobApprovedTemplate(jobName: string, reward: number, childName: string): string {
  return `🎉 <b>أحسنت يا ${childName}!</b>\n\nتمت الموافقة على عملك: <b>${jobName}</b>\nمكافأتك: <b>${reward.toFixed(2)} ر.س</b> 💰`;
}

/**
 * عمل طفل مرفوض
 */
export function jobRejectedTemplate(jobName: string, note: string | null, childName: string): string {
  const noteText = note ? `\n\nملاحظة: ${note}` : '';
  return `❌ <b>عمل مرفوض</b>\n\nيا <b>${childName}</b>، تم رفض: <b>${jobName}</b>${noteText}`;
}

/**
 * ضمان جهاز ينتهي قريباً
 */
export function warrantyExpiringTemplate(applianceName: string, days: number): string {
  return `🛡️ <b>تنبيه ضمان</b>\n\nضمان <b>${applianceName}</b> ينتهي خلال <b>${days} يوم</b>\nتأكد من تجديده أو الاحتفاظ بالفاتورة`;
}

/**
 * صيانة جهاز مستحقة
 */
export function maintenanceDueTemplate(applianceName: string, taskName: string): string {
  return `🔧 <b>صيانة مستحقة</b>\n\n<b>${applianceName}</b> يحتاج صيانة: <b>${taskName}</b>`;
}
