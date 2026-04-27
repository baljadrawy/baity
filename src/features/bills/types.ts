/**
 * أنواع TypeScript — وحدة الفواتير
 */

import type { Bill, BillPayment } from '@prisma/client';

/** فاتورة مع بيانات مُحسَبة للعرض */
export interface BillWithMeta extends Bill {
  daysLeft: number;
  isOverdue: boolean;
  lastPayment: BillPayment | null;
  paymentsCount: number;
  payments?: BillPayment[];
}

/** ملخص للـ Dashboard */
export interface BillsSummary {
  totalDue: number;       // مجموع المبالغ المستحقة
  totalOverdue: number;   // مجموع المبالغ المتأخرة
  upcomingCount: number;  // عدد الفواتير خلال 7 أيام
  paidThisMonth: number;  // عدد الفواتير المدفوعة هذا الشهر
  overdueCount: number;   // عدد الفواتير المتأخرة
}

/** مزودو الخدمة السعوديون */
export interface ServiceProvider {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  logoUrl?: string;
  color: string;         // لون بطاقة الفاتورة
}
