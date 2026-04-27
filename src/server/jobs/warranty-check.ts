/**
 * warranty-check — فحص الضمانات المنتهية قريباً
 *
 * يُشغَّل يومياً (cron) للبحث عن الأجهزة التي ضمانها ينتهي
 * خلال أيام الإشعار المحددة وإرسال تنبيه Telegram للأسرة.
 *
 * الاستخدام:
 *   - يُستدعى من /api/v1/cron/warranty-check (يحمي بـ CRON_SECRET)
 *   - أو مباشرة في BullMQ worker
 */

import { prisma } from '@/core/db';
import { sendMessage, warrantyExpiringTemplate } from '@/core/notifications/telegram';

interface WarrantyCheckResult {
  checked: number;
  notified: number;
  errors: number;
}

/**
 * يفحص كل الأجهزة التي ضمانها ينتهي قريباً ويُرسل إشعارات Telegram.
 */
export async function runWarrantyCheck(): Promise<WarrantyCheckResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // جلب كل الأجهزة التي:
  // 1. لها تاريخ انتهاء ضمان
  // 2. الضمان لم ينتهِ بعد
  // 3. ينتهي الضمان خلال warrantyNotifyDaysBefore أيام أو أقل
  const appliances = await prisma.appliance.findMany({
    where: {
      deletedAt: null,
      warrantyEnd: { not: null },
    },
    select: {
      id: true,
      name: true,
      warrantyEnd: true,
      warrantyNotifyDaysBefore: true,
      householdId: true,
    },
  });

  let notified = 0;
  let errors = 0;

  // جلب chatIds لكل household مرة واحدة (cache)
  const householdChatIds = new Map<string, string[]>();

  for (const appliance of appliances) {
    if (!appliance.warrantyEnd) continue;

    const warrantyEnd = new Date(appliance.warrantyEnd);
    warrantyEnd.setHours(0, 0, 0, 0);

    const daysLeft = Math.round(
      (warrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // تحقق: هل اليوم هو يوم الإشعار؟
    const notifyDays = appliance.warrantyNotifyDaysBefore ?? 30;
    if (daysLeft !== notifyDays && daysLeft !== 7 && daysLeft !== 1) continue;
    if (daysLeft < 0) continue; // انتهى بالفعل

    try {
      // جلب chatIds للـ household
      if (!householdChatIds.has(appliance.householdId)) {
        const members = await prisma.householdMember.findMany({
          where: {
            householdId: appliance.householdId,
            role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
          },
          select: { user: { select: { telegramChatId: true } } },
        });
        const ids = members
          .map((m) => m.user?.telegramChatId)
          .filter((id): id is string => !!id);
        householdChatIds.set(appliance.householdId, ids);
      }

      const chatIds = householdChatIds.get(appliance.householdId) ?? [];
      if (chatIds.length === 0) continue;

      const message = warrantyExpiringTemplate(appliance.name, daysLeft);

      for (const chatId of chatIds) {
        const ok = await sendMessage(chatId, message);
        if (ok) notified++;
        else errors++;
      }
    } catch (err) {
      console.error(`[warranty-check] Error for appliance ${appliance.id}:`, err);
      errors++;
    }
  }

  return { checked: appliances.length, notified, errors };
}
