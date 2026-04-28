/**
 * Telegram Bot Worker — Long polling
 *
 * يستمع للرسائل القادمة من البوت ويتعامل مع:
 * 1. /start — يرحّب ويطلب من المستخدم مشاركة جهة اتصاله
 * 2. contact (مشاركة جهة الاتصال) — يربط رقم الجوال بـ chat_id عبر استدعاء
 *    endpoint داخلي على baity-app
 *
 * هذه عملية مستقلة عن Next.js — تركض كحاوية منفصلة في docker-compose.
 * بلا تبعيات npm — node fetch فقط (Node 18+).
 *
 * متغيرات البيئة المطلوبة:
 *   TELEGRAM_BOT_TOKEN — توكن البوت
 *   APP_INTERNAL_URL   — مثل http://app:3000 (اسم الحاوية في compose)
 *   INTERNAL_SECRET    — مفتاح مشترك لاستدعاءات API الداخلية
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_INTERNAL_URL ?? 'http://app:3000';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
const POLL_TIMEOUT = 25; // ثوانٍ — long polling

if (!BOT_TOKEN) {
  console.error('[bot] TELEGRAM_BOT_TOKEN غير مُعدّ');
  process.exit(1);
}
if (!INTERNAL_SECRET) {
  console.error('[bot] INTERNAL_SECRET غير مُعدّ');
  process.exit(1);
}

const TG_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method, body) {
  const res = await fetch(`${TG_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId, text, replyMarkup) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...(replyMarkup && { reply_markup: replyMarkup }),
  });
}

/** تطبيع الرقم لصيغة 05XXXXXXXX */
function normalizeSaudiPhone(raw) {
  let p = (raw ?? '').replace(/\D/g, '');
  if (p.startsWith('966')) p = '0' + p.slice(3);
  if (p.startsWith('5') && p.length === 9) p = '0' + p;
  return p;
}

async function linkPhoneToChatId(phone, chatId, name) {
  const res = await fetch(`${APP_URL}/api/v1/internal/telegram-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET,
    },
    body: JSON.stringify({ phone, chatId: String(chatId), name }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const text = msg.text ?? '';

  // مشاركة جهة اتصال
  if (msg.contact) {
    const phone = normalizeSaudiPhone(msg.contact.phone_number);
    if (!/^05\d{8}$/.test(phone)) {
      await sendMessage(
        chatId,
        '⚠️ الرقم المُشارَك ليس سعودياً صحيحاً. الصيغة المتوقعة: 05XXXXXXXX'
      );
      return;
    }

    const name = msg.contact.first_name ?? msg.from?.first_name ?? '';
    const { status, body } = await linkPhoneToChatId(phone, chatId, name);

    if (status === 200) {
      await sendMessage(
        chatId,
        `✅ تم ربط حسابك في "بيتي" بهذا المحادثة.\n\nسترسل لك رموز تسجيل الدخول هنا تلقائياً.`,
        { remove_keyboard: true }
      );
    } else if (status === 404) {
      await sendMessage(
        chatId,
        `❓ الرقم ${phone} غير مسجَّل في "بيتي" بعد.\n\nأنشئ حساباً أولاً من التطبيق.`,
        { remove_keyboard: true }
      );
    } else {
      console.error('[bot] link failed:', status, body);
      await sendMessage(chatId, '⚠️ خطأ أثناء الربط، حاول لاحقاً.');
    }
    return;
  }

  // /start
  if (text.startsWith('/start')) {
    await sendMessage(
      chatId,
      `أهلاً بك في <b>بيتي</b> 🏠\n\nاضغط على زر "مشاركة رقمي" للسماح بإرسال رموز تسجيل الدخول لك عبر Telegram.`,
      {
        keyboard: [[{ text: '📱 مشاركة رقمي', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    );
    return;
  }

  // أي شيء آخر
  if (text.startsWith('/help') || text === '/start') return;
  await sendMessage(
    chatId,
    'استخدم /start لربط حسابك، أو شارك جهة اتصالك عبر زر المشاركة.'
  );
}

async function pollLoop() {
  let offset = 0;
  console.log('[bot] بدأ الاستماع...');

  while (true) {
    try {
      const url = `${TG_BASE}/getUpdates?timeout=${POLL_TIMEOUT}&offset=${offset}`;
      const res = await fetch(url, { signal: AbortSignal.timeout((POLL_TIMEOUT + 5) * 1000) });
      const data = await res.json();

      if (!data.ok) {
        console.error('[bot] getUpdates fail:', data);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      for (const update of data.result) {
        offset = Math.max(offset, update.update_id + 1);
        try {
          await handleUpdate(update);
        } catch (err) {
          console.error('[bot] handle error:', err);
        }
      }
    } catch (err) {
      console.error('[bot] poll error:', err.message ?? err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

pollLoop();
