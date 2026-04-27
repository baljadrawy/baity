/**
 * Types — وحدة الفواتير
 * يستخدم Prisma types كأساس مع extensions للـ UI
 */

import type { Bill, BillPayment, BillStatus, BillCategory } from '@prisma/client';

// Re-export Prisma types
export type { Bill, BillPayment, BillStatus, BillCategory };

/** فاتورة مع حسابات إضافية للـ UI */
export interface BillWithMeta extends Bill {
  daysLeft: number;
  isOverdue: boolean;
  lastPayment?: BillPayment | null;
  paymentsCount: number;
}

/** ملخص الفواتير للـ Dashboard */
export interface BillsSummary {
  totalDue: number;
  totalOverdue: number;
  upcomingCount: number;
  paidThisMonth: number;
  overdueCount: number;
}

/** مزودو الخدمة السعوديون */
export type SaudiProvider =
  | 'SEC'      // شركة الكهرباء
  | 'NWC'      // المياه الوطنية
  | 'STC'      // الاتصالات السعودية
  | 'MOBILY'   // موبايلي
  | 'ZAIN'     // زين
  | 'STCPLAY'  // STC Play
  | 'NETFLIX'  // نتفليكس
  | 'SHAHID'   // شاهد
  | 'JAWWY'    // جوي
  | 'OTHER';   // أخرى

export interface ProviderMeta {
  id: SaudiProvider;
  nameKey: string;    // مفتاح i18n
  category: string;
  color: string;      // للـ badge
}
