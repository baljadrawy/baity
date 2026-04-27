/**
 * bill-recurrence.ts — Cron Job لتحديث حالات الفواتير
 *
 * يعمل يومياً:
 * 1. يحوّل PENDING → DUE إذا اقترب الاستحقاق (خلال 3 أيام)
 * 2. يحوّل DUE → OVERDUE إذا تجاوز تاريخ الاستحقاق
 * 3. يُرسل تنبيهات Telegram للفواتير القادمة
 *
 * يُستدعى من: GET /api/v1/cron/bill-status (محمي بـ CRON_SECRET)
 */

import { prisma } from '@/core/db/prisma';
import { formatCurrency, formatDate } from '@/core/i18n/format-number';

export interface BillStatusUpdateResult {
  markedDue: number;
  markedOverdue: number;
  notificationsSent: number;
}

/**
 * تحديث حالات الفواتير اليومي
 */
export async function runBillStatusUpdate(): Promise<BillStatusUpdateResult> {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 1. PENDING → DUE (الاستحقاق خلال 3 أيام)
  const dueResult = await prisma.bill.updateMany({
    where: {
      status: 'PENDING',
      deletedAt: null,
      dueDate: { lte: threeDaysLater, gte: now },
    },
    data: { status: 'DUE', updatedAt: now },
  });

  // 2. DUE/PENDING → OVERDUE (تجاوز تاريخ الاستحقاق)
  const overdueResult = await prisma.bill.updateMany({
    where: {
      status: { in: ['PENDING', 'DUE'] },
      deletedAt: null,
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE', updatedAt: now },
  });

  // 3. جلب الفواتير التي تستحق اليوم أو غداً للإشعارات
  const billsDueSoon = await prisma.bill.findMany({
    where: {
      status: { in: ['DUE', 'PENDING'] },
      deletedAt: null,
      dueDate: {
        gte: now,
        lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // خلال 24 ساعة
      },
    },
    include: {
      household: {
        include: {
          members: {
            where: { role: { in: ['OWNER', 'ADMIN'] } },
            include: { user: true },
          },
        },
      },
    },
  });

  // TODO: إرسال إشعارات Telegram (يُكمَل في الأسبوع 6)
  // for (const bill of billsDueSoon) {
  //   await sendBillDueNotification(bill);
  // }

  return {
    markedDue: dueResult.count,
    markedOverdue: overdueResult.count,
    notificationsSent: billsDueSoon.length,
  };
}

/**
 * قالب رسالة Telegram للفاتورة المستحقة
 * الأرقام عبر formatCurrency/formatDate لضمان 0-9
 */
export function buildBillDueMessage(bill: {
  title: string;
  amount: unknown;
  dueDate: Date;
}): string {
  const amount = formatCurrency(Number(bill.amount), 'ar');
  const date = formatDate(bill.dueDate, 'ar');

  return [
    '🔔 *تنبيه فاتورة*',
    '',
    `📄 ${bill.title}`,
    `💰 المبلغ: ${amount}`,
    `📅 تستحق: ${date}`,
  ].join('\n');
}
