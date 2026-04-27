/**
 * Bills Repository — طبقة Data Access للفواتير
 *
 * القاعدة: كل query يفلتر بـ householdId (Multi-Tenancy)
 * القاعدة: لا query مباشر خارج الـ repository
 * القاعدة: الـ soft delete (deletedAt) مُطبَّق تلقائياً
 */

import { prisma } from '@/core/db/prisma';
import type { Bill, Prisma } from '@prisma/client';
import type { CreateBillInput, UpdateBillInput, PayBillInput, BillFilters } from '../schemas';
import type { BillWithMeta, BillsSummary } from '../types';

export class BillsRepository {
  constructor(private readonly householdId: string) {}

  // ============================================================
  // Queries
  // ============================================================

  /**
   * جلب كل الفواتير مع فلترة وترقيم صفحات
   */
  async list(filters?: BillFilters): Promise<{ data: BillWithMeta[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BillWhereInput = {
      householdId: this.householdId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.search && {
        title: { contains: filters.search, mode: 'insensitive' },
      }),
      ...(filters?.from || filters?.to
        ? {
            dueDate: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
    };

    const [bills, total] = await prisma.$transaction([
      prisma.bill.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip,
        take: limit,
        include: {
          payments: { orderBy: { paidAt: 'desc' }, take: 1 },
          _count: { select: { payments: true } },
        },
      }),
      prisma.bill.count({ where }),
    ]);

    const now = new Date();
    const data = bills.map((bill) => {
      const daysLeft = Math.ceil(
        (bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...bill,
        daysLeft,
        isOverdue: daysLeft < 0 && bill.status !== 'PAID',
        lastPayment: bill.payments[0] ?? null,
        paymentsCount: bill._count.payments,
      };
    });

    return { data, total };
  }

  /**
   * جلب فاتورة واحدة بـ ID
   */
  async findById(id: string): Promise<BillWithMeta | null> {
    const bill = await prisma.bill.findFirst({
      where: { id, householdId: this.householdId, deletedAt: null },
      include: {
        payments: { orderBy: { paidAt: 'desc' } },
        _count: { select: { payments: true } },
      },
    });

    if (!bill) return null;

    const now = new Date();
    const daysLeft = Math.ceil(
      (bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...bill,
      daysLeft,
      isOverdue: daysLeft < 0 && bill.status !== 'PAID',
      lastPayment: bill.payments[0] ?? null,
      paymentsCount: bill._count.payments,
    };
  }

  /**
   * ملخص للـ Dashboard
   */
  async getSummary(): Promise<BillsSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [overdueCount, paidThisMonth, upcomingCount] = await prisma.$transaction([
      prisma.bill.count({
        where: { householdId: this.householdId, deletedAt: null, status: 'OVERDUE' },
      }),
      prisma.bill.count({
        where: {
          householdId: this.householdId,
          deletedAt: null,
          status: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.bill.count({
        where: {
          householdId: this.householdId,
          deletedAt: null,
          status: { in: ['PENDING', 'DUE'] },
          dueDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // مجموع المبالغ المستحقة
    const dueAmounts = await prisma.bill.aggregate({
      where: {
        householdId: this.householdId,
        deletedAt: null,
        status: { in: ['DUE', 'OVERDUE'] },
      },
      _sum: { amount: true },
    });

    const overdueAmounts = await prisma.bill.aggregate({
      where: {
        householdId: this.householdId,
        deletedAt: null,
        status: 'OVERDUE',
      },
      _sum: { amount: true },
    });

    return {
      totalDue: Number(dueAmounts._sum.amount ?? 0),
      totalOverdue: Number(overdueAmounts._sum.amount ?? 0),
      upcomingCount,
      paidThisMonth,
      overdueCount,
    };
  }

  // ============================================================
  // Mutations
  // ============================================================

  /**
   * إنشاء فاتورة جديدة
   */
  async create(data: CreateBillInput): Promise<Bill> {
    return prisma.bill.create({
      data: {
        householdId: this.householdId,
        title: data.title,
        category: data.category,
        provider: data.provider,
        accountNumber: data.accountNumber,
        amount: data.amount,
        dueDate: data.dueDate,
        isRecurring: data.isRecurring,
        recurrencePeriod: data.recurrencePeriod,
        notes: data.notes,
        status: 'PENDING',
      },
    });
  }

  /**
   * تحديث فاتورة
   */
  async update(id: string, data: UpdateBillInput): Promise<Bill> {
    return prisma.bill.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * تسجيل دفع فاتورة
   */
  async pay(id: string, data: PayBillInput): Promise<Bill> {
    return prisma.$transaction(async (tx) => {
      // سجّل الدفعة
      await tx.billPayment.create({
        data: {
          billId: id,
          amount: data.amount,
          paidAt: data.paidAt,
          notes: data.notes,
        },
      });

      // حدّث حالة الفاتورة
      return tx.bill.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: data.paidAt,
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * حذف ناعم (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.bill.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * توليد الفاتورة المتكررة التالية
   */
  async generateNextRecurring(bill: Bill): Promise<Bill> {
    if (!bill.isRecurring || !bill.recurrencePeriod) {
      throw new Error('Bill is not recurring');
    }

    const nextDueDate = calculateNextDueDate(bill.dueDate, bill.recurrencePeriod);

    return prisma.bill.create({
      data: {
        householdId: bill.householdId,
        title: bill.title,
        category: bill.category,
        provider: bill.provider,
        accountNumber: bill.accountNumber,
        amount: bill.amount,
        dueDate: nextDueDate,
        isRecurring: true,
        recurrencePeriod: bill.recurrencePeriod,
        notes: bill.notes,
        status: 'PENDING',
      },
    });
  }
}

// ============================================================
// Helper
// ============================================================

function calculateNextDueDate(
  currentDueDate: Date,
  period: string
): Date {
  const next = new Date(currentDueDate);
  switch (period) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
