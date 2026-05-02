/**
 * notifications-dispatcher — يُرسل تنبيهات Telegram للحالات الحرجة
 *
 * يُشغَّل يومياً (cron) ويفحص:
 * - فواتير تستحق اليوم / خلال 3 أيام / خلال 7 أيام (billDueTemplate)
 * - فواتير متأخرة 1/7 يوم (billOverdueTemplate)
 * - مهام دورية متأخرة 1/3 يوم (choreOverdueTemplate)
 * - صيانة جهاز مستحقة اليوم (maintenanceDueTemplate)
 *
 * ملاحظة: warranty-check يعالج الضمانات بشكل منفصل.
 *
 * الاستخدام:
 *   - GET /api/v1/cron/notifications (محمي بـ CRON_SECRET)
 *   - يُجدوَل يومياً في crontab
 */

import { prisma } from '@/core/db';
import {
  sendMessage,
  billDueTemplate,
  billOverdueTemplate,
  choreOverdueTemplate,
  maintenanceDueTemplate,
  archiveExpiringTemplate,
} from '@/core/notifications/telegram';
import { sendPushToHousehold, isWebPushEnabled } from '@/core/notifications/web-push';

export interface DispatchResult {
  billsNotified: number;
  choresNotified: number;
  maintenanceNotified: number;
  archiveNotified: number;
  pushNotified: number;
  errors: number;
}

/** أيام التذكير التي يُرسل فيها notification — متناغم مع warranty-check */
const BILL_DUE_NOTIFY_DAYS = new Set([0, 1, 3, 7]);
const BILL_OVERDUE_NOTIFY_DAYS = new Set([1, 7]);
const CHORE_OVERDUE_NOTIFY_DAYS = new Set([1, 3]);

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

/** cache: householdId → chatIds */
async function loadChatIds(
  cache: Map<string, string[]>,
  householdId: string
): Promise<string[]> {
  if (cache.has(householdId)) return cache.get(householdId)!;
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { telegramChatId: true },
  });
  const ids = household?.telegramChatId ? [household.telegramChatId] : [];
  cache.set(householdId, ids);
  return ids;
}

export async function runNotificationsDispatcher(): Promise<DispatchResult> {
  const today = new Date();
  const result: DispatchResult = {
    billsNotified: 0,
    choresNotified: 0,
    maintenanceNotified: 0,
    archiveNotified: 0,
    pushNotified: 0,
    errors: 0,
  };
  const chatCache = new Map<string, string[]>();
  const webPushOn = isWebPushEnabled();

  /** يرسل عبر كل القنوات المتاحة (Telegram + Web Push إن مفعّل) */
  async function dispatch(
    householdId: string,
    chatIds: string[],
    telegramText: string,
    push: { title: string; body: string; url?: string; tag?: string }
  ): Promise<{ telegramOk: number; pushOk: number; errs: number }> {
    let telegramOk = 0;
    let errs = 0;
    for (const chatId of chatIds) {
      const ok = await sendMessage(chatId, telegramText);
      if (ok) telegramOk++;
      else errs++;
    }
    let pushOk = 0;
    if (webPushOn) {
      try {
        pushOk = await sendPushToHousehold(householdId, push);
      } catch (err) {
        console.warn('[notifications] push send failed:', err);
      }
    }
    return { telegramOk, pushOk, errs };
  }

  // 1. الفواتير المستحقة قريباً (PENDING/DUE)
  const upcomingBills = await prisma.bill.findMany({
    where: {
      deletedAt: null,
      status: { in: ['PENDING', 'DUE'] },
      dueDate: { gte: startOfDay(today) },
    },
    select: {
      id: true,
      title: true,
      amount: true,
      dueDate: true,
      householdId: true,
    },
  });

  for (const bill of upcomingBills) {
    const days = diffDays(bill.dueDate, today);
    if (!BILL_DUE_NOTIFY_DAYS.has(days)) continue;

    try {
      const chatIds = await loadChatIds(chatCache, bill.householdId);
      const text = billDueTemplate(bill.title, days, Number(bill.amount));
      const out = await dispatch(bill.householdId, chatIds, text, {
        title: 'فاتورة قادمة',
        body: `${bill.title} — ${days === 0 ? 'اليوم' : `${days} يوم`}`,
        url: '/bills',
        tag: `bill-${bill.id}`,
      });
      result.billsNotified += out.telegramOk;
      result.pushNotified += out.pushOk;
      result.errors += out.errs;
    } catch (err) {
      console.error('[notifications] bill-due error:', err);
      result.errors++;
    }
  }

  // 2. الفواتير المتأخرة (OVERDUE)
  const overdueBills = await prisma.bill.findMany({
    where: {
      deletedAt: null,
      status: 'OVERDUE',
      dueDate: { lt: startOfDay(today) },
    },
    select: { id: true, title: true, dueDate: true, householdId: true },
  });

  for (const bill of overdueBills) {
    const days = -diffDays(bill.dueDate, today);
    if (!BILL_OVERDUE_NOTIFY_DAYS.has(days)) continue;

    try {
      const chatIds = await loadChatIds(chatCache, bill.householdId);
      const text = billOverdueTemplate(bill.title, days);
      const out = await dispatch(bill.householdId, chatIds, text, {
        title: 'فاتورة متأخرة',
        body: `${bill.title} — منذ ${days} يوم`,
        url: '/bills',
        tag: `bill-overdue-${bill.id}`,
      });
      result.billsNotified += out.telegramOk;
      result.pushNotified += out.pushOk;
      result.errors += out.errs;
    } catch (err) {
      console.error('[notifications] bill-overdue error:', err);
      result.errors++;
    }
  }

  // 3. المهام المتأخرة
  const overdueChores = await prisma.chore.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      nextDueDate: { lt: startOfDay(today) },
    },
    select: { id: true, name: true, nextDueDate: true, householdId: true },
  });

  for (const chore of overdueChores) {
    if (!chore.nextDueDate) continue;
    const days = -diffDays(chore.nextDueDate, today);
    if (!CHORE_OVERDUE_NOTIFY_DAYS.has(days)) continue;

    try {
      const chatIds = await loadChatIds(chatCache, chore.householdId);
      const text = choreOverdueTemplate(chore.name);
      const out = await dispatch(chore.householdId, chatIds, text, {
        title: 'مهمة متأخرة',
        body: chore.name,
        url: '/chores',
        tag: `chore-${chore.id}`,
      });
      result.choresNotified += out.telegramOk;
      result.pushNotified += out.pushOk;
      result.errors += out.errs;
    } catch (err) {
      console.error('[notifications] chore-overdue error:', err);
      result.errors++;
    }
  }

  // 4. صيانة الأجهزة المستحقة اليوم
  const dueSchedules = await prisma.maintenanceSchedule.findMany({
    where: {
      isActive: true,
      nextDueAt: {
        gte: startOfDay(today),
        lt: new Date(startOfDay(today).getTime() + 86400000),
      },
    },
    include: {
      appliance: { select: { id: true, name: true, householdId: true, isActive: true } },
    },
  });

  for (const sched of dueSchedules) {
    if (!sched.appliance.isActive) continue;
    try {
      const chatIds = await loadChatIds(chatCache, sched.appliance.householdId);
      const text = maintenanceDueTemplate(sched.appliance.name, sched.taskName);
      const out = await dispatch(sched.appliance.householdId, chatIds, text, {
        title: 'صيانة مستحقة',
        body: `${sched.appliance.name}: ${sched.taskName}`,
        url: '/appliances',
        tag: `maintenance-${sched.id}`,
      });
      result.maintenanceNotified += out.telegramOk;
      result.pushNotified += out.pushOk;
      result.errors += out.errs;
    } catch (err) {
      console.error('[notifications] maintenance-due error:', err);
      result.errors++;
    }
  }

  // 5. وثائق الأرشيف التي تنتهي قريباً (حسب notifyBeforeDays لكل وثيقة)
  const expiringDocs = await prisma.documentArchive.findMany({
    where: {
      deletedAt: null,
      expiryDate: { not: null, gte: startOfDay(today) },
    },
    select: {
      id: true,
      title: true,
      expiryDate: true,
      notifyBeforeDays: true,
      householdId: true,
    },
  });

  for (const doc of expiringDocs) {
    if (!doc.expiryDate) continue;
    const days = diffDays(doc.expiryDate, today);
    const notifyDays = doc.notifyBeforeDays ?? 30;
    // أرسل عند: notifyDays، 7 أيام، 1 يوم، اليوم نفسه
    if (![notifyDays, 7, 1, 0].includes(days)) continue;

    try {
      const chatIds = await loadChatIds(chatCache, doc.householdId);
      const text = archiveExpiringTemplate(doc.title, days);
      const out = await dispatch(doc.householdId, chatIds, text, {
        title: 'وثيقة تنتهي قريباً',
        body: `${doc.title} — ${days === 0 ? 'اليوم' : `${days} يوم`}`,
        url: '/archive',
        tag: `archive-${doc.id}`,
      });
      result.archiveNotified += out.telegramOk;
      result.pushNotified += out.pushOk;
      result.errors += out.errs;
    } catch (err) {
      console.error('[notifications] archive-expiring error:', err);
      result.errors++;
    }
  }

  console.log(
    `[notifications] bills=${result.billsNotified} chores=${result.choresNotified} ` +
      `maintenance=${result.maintenanceNotified} archive=${result.archiveNotified} ` +
      `push=${result.pushNotified} errors=${result.errors}`
  );

  return result;
}
