/**
 * House Economy Repository — طبقة Data Access لاقتصاد البيت
 *
 * القاعدة: كل query يفلتر بـ householdId
 * القاعدة: المبالغ دائماً Decimal — يُحوَّل لـ number عند الإرجاع للـ API
 * القاعدة: WalletTransaction تتطلب walletId (ليس memberId مباشرة)
 */

import { prisma } from '@/core/db/prisma';
import type { Prisma } from '@prisma/client';
import type {
  CreateJobMenuItemInput,
  UpdateJobMenuItemInput,
  StartJobInput,
  SubmitJobInput,
  ApproveJobInput,
  RejectJobInput,
  UpdateWalletDistributionInput,
  CreateSavingsGoalInput,
} from '../schemas';
import type { JobMenuItemWithStats, ChildWalletWithDetails, WalletSummary } from '../types';

export class HouseEconomyRepository {
  constructor(private readonly householdId: string) {}

  // ============================================================
  // Job Menu Items
  // ============================================================

  async listJobMenuItems(filters?: {
    isActive?: boolean;
    childMemberId?: string;
    search?: string;
  }): Promise<JobMenuItemWithStats[]> {
    const where = {
      householdId: this.householdId,
      deletedAt: null,
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.search && {
        title: { contains: filters.search, mode: 'insensitive' as const },
      }),
    };

    const items = await prisma.jobMenuItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { instances: { where: { status: { in: ['STARTED', 'SUBMITTED'] } } } },
        },
      },
    });

    // حساب المنجز هذا الأسبوع
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return Promise.all(
      items.map(async (item) => {
        // فلتر حسب الطفل إذا طُلب
        if (
          filters?.childMemberId &&
          item.availableForIds.length > 0 &&
          !item.availableForIds.includes(filters.childMemberId)
        ) {
          return null;
        }

        const completedThisWeek = await prisma.jobInstance.count({
          where: {
            jobMenuItemId: item.id,
            status: 'APPROVED',
            completedAt: { gte: weekStart },
          },
        });

        return {
          ...item,
          activeInstancesCount: item._count.instances,
          completedThisWeek,
        };
      })
    ).then((results) => results.filter(Boolean) as JobMenuItemWithStats[]);
  }

  async findJobMenuItemById(id: string): Promise<JobMenuItemWithStats | null> {
    const item = await prisma.jobMenuItem.findFirst({
      where: { id, householdId: this.householdId, deletedAt: null },
      include: {
        _count: {
          select: { instances: { where: { status: { in: ['STARTED', 'SUBMITTED'] } } } },
        },
      },
    });
    if (!item) return null;
    return { ...item, activeInstancesCount: item._count.instances, completedThisWeek: 0 };
  }

  async createJobMenuItem(data: CreateJobMenuItemInput) {
    return prisma.jobMenuItem.create({
      data: {
        householdId: this.householdId,
        title: data.title,
        description: data.description,
        iconEmoji: data.iconEmoji,
        reward: data.reward,
        estimatedMinutes: data.estimatedMinutes,
        minAge: data.minAge,
        maxAge: data.maxAge,
        category: data.category,
        difficulty: data.difficulty,
        availableForIds: data.availableForIds,
        weeklyLimit: data.weeklyLimit,
        isActive: data.isActive,
      },
    });
  }

  async updateJobMenuItem(id: string, data: UpdateJobMenuItemInput) {
    return prisma.jobMenuItem.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  }

  async deleteJobMenuItem(id: string) {
    await prisma.jobMenuItem.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ============================================================
  // Job Instances
  // ============================================================

  async listJobInstances(filters?: {
    childId?: string;
    status?: string;
    limit?: number;
  }) {
    const where = {
      jobMenuItem: { householdId: this.householdId },
      ...(filters?.childId && { childId: filters.childId }),
      ...(filters?.status && { status: filters.status as Prisma.JobInstanceWhereInput['status'] }),
    };

    return prisma.jobInstance.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: filters?.limit ?? 50,
      include: {
        jobMenuItem: {
          select: { id: true, title: true, iconEmoji: true, reward: true, difficulty: true },
        },
        child: {
          select: { user: { select: { name: true } } },
        },
      },
    });
  }

  async startJob(data: StartJobInput, childId: string) {
    // التحقق من الحد الأسبوعي
    const item = await prisma.jobMenuItem.findFirst({
      where: { id: data.jobMenuItemId, householdId: this.householdId, deletedAt: null },
    });
    if (!item) throw new Error('العمل غير موجود');

    if (item.weeklyLimit) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const countThisWeek = await prisma.jobInstance.count({
        where: {
          jobMenuItemId: data.jobMenuItemId,
          childId,
          startedAt: { gte: weekStart },
        },
      });
      if (countThisWeek >= item.weeklyLimit) {
        throw new Error(`وصلت للحد الأسبوعي (${item.weeklyLimit} مرات)`);
      }
    }

    return prisma.jobInstance.create({
      data: { jobMenuItemId: data.jobMenuItemId, childId },
    });
  }

  async submitJob(instanceId: string, data: SubmitJobInput, childId: string) {
    const instance = await prisma.jobInstance.findFirst({
      where: { id: instanceId, childId, status: 'STARTED' },
    });
    if (!instance) throw new Error('لا يمكن إرسال هذا العمل');

    return prisma.jobInstance.update({
      where: { id: instanceId },
      data: {
        status: 'SUBMITTED',
        beforePhotoUrl: data.beforePhotoUrl,
        afterPhotoUrl: data.afterPhotoUrl,
        completedAt: new Date(),
      },
    });
  }

  /**
   * موافقة الوالد على العمل — يُنشئ معاملة في محفظة الطفل
   */
  async approveJob(instanceId: string, data: ApproveJobInput, approvedById: string) {
    return prisma.$transaction(async (tx) => {
      const instance = await tx.jobInstance.findUniqueOrThrow({
        where: { id: instanceId },
        include: {
          jobMenuItem: { select: { title: true } },
          child: { select: { wallet: { select: { id: true } } } },
        },
      });

      if (instance.status !== 'SUBMITTED') throw new Error('العمل غير في انتظار الموافقة');

      const totalReward = Number(data.approvedAmount) + Number(data.bonusAmount ?? 0);

      // تحديث حالة العمل
      const updated = await tx.jobInstance.update({
        where: { id: instanceId },
        data: {
          status: totalReward < Number(instance.jobMenuItem) ? 'PARTIAL' : 'APPROVED',
          approvedAt: new Date(),
          approvedById,
          approvedAmount: data.approvedAmount,
          bonusAmount: data.bonusAmount ?? 0,
          parentNotes: data.parentNotes,
        },
      });

      // إضافة للمحفظة إذا وُجدت
      const walletId = instance.child.wallet?.id;
      if (walletId && totalReward > 0) {
        await tx.walletTransaction.create({
          data: {
            walletId,
            amount: totalReward,
            type: 'JOB_REWARD',
            description: `مكافأة: ${instance.jobMenuItem.title}`,
            relatedJobId: instanceId,
            approvedById,
          },
        });

        await tx.childWallet.update({
          where: { id: walletId },
          data: {
            balance: { increment: totalReward },
            totalEarned: { increment: totalReward },
          },
        });
      }

      return updated;
    });
  }

  async rejectJob(instanceId: string, data: RejectJobInput, rejectedById: string) {
    const instance = await prisma.jobInstance.findFirst({
      where: { id: instanceId, status: 'SUBMITTED' },
    });
    if (!instance) throw new Error('العمل غير في انتظار الموافقة');

    return prisma.jobInstance.update({
      where: { id: instanceId },
      data: {
        status: 'REJECTED',
        approvedById: rejectedById,
        parentNotes: data.parentNotes,
      },
    });
  }

  // ============================================================
  // Wallets
  // ============================================================

  async getWalletSummary(): Promise<WalletSummary> {
    // جلب كل الأطفال في البيت
    const children = await prisma.householdMember.findMany({
      where: { householdId: this.householdId, role: 'CHILD' },
      select: {
        id: true,
        user: { select: { name: true } },
        age: true,
        wallet: {
          select: { balance: true, totalEarned: true, totalSpent: true, totalSaved: true, totalCharity: true },
        },
      },
    });

    const childrenData = children.map((c) => ({
      memberId: c.id,
      name: c.user.name,
      balance: Number(c.wallet?.balance ?? 0),
    }));

    return {
      totalBalance: childrenData.reduce((s, c) => s + c.balance, 0),
      totalEarned: children.reduce((s, c) => s + Number(c.wallet?.totalEarned ?? 0), 0),
      totalSpent: children.reduce((s, c) => s + Number(c.wallet?.totalSpent ?? 0), 0),
      totalSaved: children.reduce((s, c) => s + Number(c.wallet?.totalSaved ?? 0), 0),
      totalCharity: children.reduce((s, c) => s + Number(c.wallet?.totalCharity ?? 0), 0),
      children: childrenData,
    };
  }

  async getChildWallet(memberId: string): Promise<ChildWalletWithDetails | null> {
    const member = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId: this.householdId },
      select: {
        id: true,
        age: true,
        user: { select: { name: true } },
        wallet: {
          include: {
            goals: { orderBy: { createdAt: 'desc' } },
            transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
      },
    });

    if (!member?.wallet) return null;

    return {
      ...member.wallet,
      memberId: member.id,
      memberName: member.user.name,
      memberAge: member.age,
      goals: member.wallet.goals,
      recentTransactions: member.wallet.transactions,
    };
  }

  async updateWalletDistribution(memberId: string, data: UpdateWalletDistributionInput) {
    const wallet = await prisma.childWallet.findUnique({ where: { memberId } });
    if (!wallet) throw new Error('المحفظة غير موجودة');

    return prisma.childWallet.update({
      where: { memberId },
      data: {
        spendPercent: data.spendPercent,
        savePercent: data.savePercent,
        charityPercent: data.charityPercent,
        surprisePercent: data.surprisePercent,
        weeklyEarningsLimit: data.weeklyEarningsLimit,
      },
    });
  }

  async createSavingsGoal(memberId: string, data: CreateSavingsGoalInput) {
    const wallet = await prisma.childWallet.findUnique({
      where: { memberId },
      select: { id: true },
    });
    if (!wallet) throw new Error('wallet_not_found');

    return prisma.savingsGoal.create({
      data: {
        walletId: wallet.id,
        title: data.title,
        targetAmount: data.targetAmount,
        imageUrl: data.imageUrl,
      },
    });
  }

  async updateSavingsGoal(
    memberId: string,
    goalId: string,
    data: Partial<CreateSavingsGoalInput>
  ) {
    // verify chain: goal → wallet → member → household
    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        wallet: { member: { id: memberId, householdId: this.householdId } },
      },
      select: { id: true },
    });
    if (!goal) throw new Error('goal_not_found');

    return prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
  }

  async deleteSavingsGoal(memberId: string, goalId: string) {
    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        wallet: { member: { id: memberId, householdId: this.householdId } },
      },
      select: { id: true },
    });
    if (!goal) throw new Error('goal_not_found');

    await prisma.savingsGoal.delete({ where: { id: goalId } });
  }

  // ============================================================
  // Pending Approvals (للوالدين)
  // ============================================================

  async getPendingApprovals() {
    return prisma.jobInstance.findMany({
      where: {
        status: 'SUBMITTED',
        jobMenuItem: { householdId: this.householdId },
      },
      orderBy: { completedAt: 'asc' },
      include: {
        jobMenuItem: { select: { id: true, title: true, iconEmoji: true, reward: true } },
        child: { select: { user: { select: { name: true } } } },
      },
    });
  }
}
