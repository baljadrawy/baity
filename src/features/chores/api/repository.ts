/**
 * Chores Repository — طبقة Data Access للمهام الدورية
 *
 * القاعدة: كل query يفلتر بـ householdId (Multi-Tenancy)
 * القاعدة: الـ soft delete (deletedAt) مُطبَّق تلقائياً
 * ملاحظة: assignedMemberIds هو String[] (مصفوفة) — ليس relation
 * ملاحظة: ChoreExecution.executedById (وليس executedBy)
 * ملاحظة: WalletTransaction يتطلب walletId (وليس memberId مباشرة)
 */

import { prisma } from '@/core/db/prisma';
import type { Chore, ChoreExecution } from '@prisma/client';
import type { CreateChoreInput, UpdateChoreInput, ExecuteChoreInput } from '../schemas';
import {
  calculateNextDueDate,
  assignChore,
  getDaysUntilDue,
  isChoreOverdue,
  type MemberExecution,
} from '../lib/period-engine';

export interface ChoreWithMeta extends Chore {
  nextDueDate: Date | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  assignedMemberNames: string[];
  lastExecution?: ChoreExecution | null;
  executionsCount: number;
}

export class ChoresRepository {
  constructor(private readonly householdId: string) {}

  // ============================================================
  // Queries
  // ============================================================

  async list(filters?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ChoreWithMeta[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      householdId: this.householdId,
      deletedAt: null,
      isActive: true,
      ...(filters?.search && {
        name: { contains: filters.search, mode: 'insensitive' as const },
      }),
    };

    const [chores, total] = await prisma.$transaction([
      prisma.chore.findMany({
        where,
        orderBy: { nextDueDate: 'asc' },
        skip,
        take: limit,
        include: {
          executions: {
            orderBy: { executedAt: 'desc' },
            take: 1,
          },
          _count: { select: { executions: true } },
        },
      }),
      prisma.chore.count({ where }),
    ]);

    // جلب أسماء الأعضاء المُسنَدين دفعة واحدة
    const allMemberIds = [...new Set(chores.flatMap((c) => c.assignedMemberIds))];
    const memberNames = allMemberIds.length > 0
      ? await this._getMemberNames(allMemberIds)
      : {};

    const data = chores.map((chore) => {
      const lastExec = chore.executions[0] ?? null;
      const lastExecutedAt = lastExec?.executedAt ?? chore.lastExecutedAt ?? null;

      const schedule = {
        periodType: chore.periodType,
        periodDays: chore.periodDays,
        periodWeekDay: chore.periodWeekDay,
        periodMonthDay: chore.periodMonthDay,
        firstExecutionDate: chore.firstExecutionDate,
        dueDateRollover: chore.dueDateRollover,
      };

      // استخدم nextDueDate من الـ DB إن وُجد، وإلا احسبه
      const nextDueDate = chore.nextDueDate ?? calculateNextDueDate(schedule, lastExecutedAt);
      const daysUntilDue = getDaysUntilDue(nextDueDate);

      return {
        ...chore,
        nextDueDate,
        daysUntilDue,
        isOverdue: isChoreOverdue(nextDueDate),
        assignedMemberNames: chore.assignedMemberIds.map((id) => memberNames[id] ?? id),
        lastExecution: lastExec,
        executionsCount: chore._count.executions,
      };
    });

    return { data, total };
  }

  async findById(id: string): Promise<ChoreWithMeta | null> {
    const chore = await prisma.chore.findFirst({
      where: { id, householdId: this.householdId, deletedAt: null },
      include: {
        executions: { orderBy: { executedAt: 'desc' }, take: 5 },
        _count: { select: { executions: true } },
      },
    });

    if (!chore) return null;

    const memberNames = chore.assignedMemberIds.length > 0
      ? await this._getMemberNames(chore.assignedMemberIds)
      : {};

    const lastExec = chore.executions[0] ?? null;
    const lastExecutedAt = lastExec?.executedAt ?? chore.lastExecutedAt ?? null;
    const schedule = {
      periodType: chore.periodType,
      periodDays: chore.periodDays,
      periodWeekDay: chore.periodWeekDay,
      periodMonthDay: chore.periodMonthDay,
      firstExecutionDate: chore.firstExecutionDate,
      dueDateRollover: chore.dueDateRollover,
    };

    const nextDueDate = chore.nextDueDate ?? calculateNextDueDate(schedule, lastExecutedAt);

    return {
      ...chore,
      nextDueDate,
      daysUntilDue: getDaysUntilDue(nextDueDate),
      isOverdue: isChoreOverdue(nextDueDate),
      assignedMemberNames: chore.assignedMemberIds.map((id) => memberNames[id] ?? id),
      lastExecution: lastExec,
      executionsCount: chore._count.executions,
    };
  }

  // ============================================================
  // Mutations
  // ============================================================

  async create(data: CreateChoreInput): Promise<Chore> {
    return prisma.chore.create({
      data: {
        householdId: this.householdId,
        name: data.name,
        description: data.description,
        periodType: data.periodType,
        periodDays: data.periodDays,
        periodWeekDay: data.periodWeekDay,
        periodMonthDay: data.periodMonthDay,
        assignmentType: data.assignmentType,
        assignedMemberIds: data.assignedMembers ?? [],
        firstExecutionDate: data.firstExecutionDate,
        notifyBeforeDays: data.notifyBeforeDays,
        pointsReward: data.pointsReward,
        dueDateRollover: data.dueDateRollover,
      },
    });
  }

  async update(id: string, data: UpdateChoreInput): Promise<Chore> {
    return prisma.chore.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  /**
   * تنفيذ مهمة — يُسجَّل التنفيذ ويُعاد حساب الإسناد
   * Execute a chore: log execution, recalculate assignment, award points if applicable.
   */
  async execute(
    id: string,
    data: ExecuteChoreInput,
    executorMemberId: string,
  ): Promise<ChoreExecution> {
    return prisma.$transaction(async (tx) => {
      // جلب المهمة
      const chore = await tx.chore.findUniqueOrThrow({
        where: { id },
        include: {
          executions: {
            select: { executedById: true, executedAt: true },
          },
        },
      });

      // سجّل التنفيذ
      const execution = await tx.choreExecution.create({
        data: {
          choreId: id,
          executedById: data.executedBy ?? executorMemberId,
          executedAt: data.executedAt ?? new Date(),
          notes: data.notes,
          pointsAwarded: chore.pointsReward,
        },
      });

      // تحديث lastExecutedAt و lastExecutedById
      await tx.chore.update({
        where: { id },
        data: {
          lastExecutedAt: execution.executedAt,
          lastExecutedById: execution.executedById,
        },
      });

      // إذا كان الإسناد ديناميكياً — احسب الشخص التالي
      if (
        chore.assignmentType !== 'FIXED' &&
        chore.assignmentType !== 'NO_ASSIGNMENT' &&
        chore.assignedMemberIds.length > 0
      ) {
        // جلب إحصائيات الأعضاء المُسنَدين
        const memberNames = await this._getMemberNames(chore.assignedMemberIds);

        const memberStats: MemberExecution[] = await Promise.all(
          chore.assignedMemberIds.map(async (memberId) => {
            const count = await tx.choreExecution.count({
              where: { choreId: id, executedById: memberId },
            });
            const lastExec = await tx.choreExecution.findFirst({
              where: { choreId: id, executedById: memberId },
              orderBy: { executedAt: 'desc' },
              select: { executedAt: true },
            });
            return {
              memberId,
              name: memberNames[memberId] ?? memberId,
              executionCount: count,
              lastExecutedAt: lastExec?.executedAt ?? null,
            };
          })
        );

        const nextMemberId = assignChore(chore.assignmentType, memberStats);

        if (nextMemberId) {
          // تحديث أول ID في المصفوفة كـ "الحالي"
          // نضعه في مقدمة assignedMemberIds لتسهيل قراءة "من المُسنَد الآن"
          const reordered = [
            nextMemberId,
            ...chore.assignedMemberIds.filter((mid) => mid !== nextMemberId),
          ];
          await tx.chore.update({
            where: { id },
            data: { assignedMemberIds: reordered },
          });
        }
      }

      // منح نقاط للمنفّذ إذا كان هناك مكافأة — يتطلب محفظة طفل
      if (chore.pointsReward > 0) {
        const memberId = data.executedBy ?? executorMemberId;

        // ابحث عن محفظة الطفل — ليست كل الأعضاء لديهم محفظة
        const wallet = await tx.childWallet.findUnique({
          where: { memberId },
          select: { id: true },
        });

        if (wallet) {
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: chore.pointsReward,
              type: 'JOB_REWARD',
              description: `إنجاز: ${chore.name}`,
              relatedJobId: execution.id,
            },
          });

          // تحديث إجمالي المكاسب في المحفظة
          await tx.childWallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: chore.pointsReward },
              totalEarned: { increment: chore.pointsReward },
            },
          });
        }
      }

      return execution;
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.chore.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * جلب أسماء الأعضاء من الـ DB دفعة واحدة
   * Returns a map of memberId → name
   */
  private async _getMemberNames(memberIds: string[]): Promise<Record<string, string>> {
    if (memberIds.length === 0) return {};

    const members = await prisma.householdMember.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        user: { select: { name: true } },
      },
    });

    return Object.fromEntries(members.map((m) => [m.id, m.user.name]));
  }
}
