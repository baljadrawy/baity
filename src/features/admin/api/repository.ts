/**
 * AdminRepository — جمع إحصائيات على مستوى المنصة (cross-household).
 *
 * ⚠️ ملاحظة: هذا الـ repository يقصد عبور حدود الـ households (super-admin only).
 * لا يفلتر بـ householdId. يجب الوصول إليه فقط بعد فحص isSuperAdmin.
 */

import { prisma } from '@/core/db/prisma';

export interface AdminStats {
  totals: {
    households: number;
    users: number;
    bills: number;
    chores: number;
    shoppingLists: number;
    appliances: number;
    archive: number;
  };
  usersByRole: {
    OWNER: number;
    ADMIN: number;
    MEMBER: number;
    CHILD: number;
  };
  signups: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
  activity: {
    billsPaidLast7Days: number;
    choresExecutedLast7Days: number;
    documentsUploadedLast7Days: number;
    activeUsersLast30Days: number;
  };
  recentHouseholds: Array<{
    id: string;
    name: string;
    createdAt: Date;
    membersCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'household_created' | 'bill_paid' | 'chore_done' | 'member_joined';
    description: string;
    timestamp: Date;
    householdId: string;
  }>;
  subscription: {
    inTrial: number;
    active: number;
    cancelled: number;
  };
}

export class AdminRepository {
  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    // Aggregations بالتوازي
    const [
      householdsCount,
      usersCount,
      billsCount,
      choresCount,
      shoppingListsCount,
      appliancesCount,
      archiveCount,
      ownersCount,
      adminsCount,
      membersCount,
      childrenCount,
      signupsToday,
      signupsLast7,
      signupsLast30,
      billsPaidLast7,
      choresExecutedLast7,
      documentsUploadedLast7,
      activeUsersLast30,
      recentHouseholdsRaw,
      recentBillPayments,
      recentChoreExecutions,
      recentMembers,
      recentHouseholdsForActivity,
      subInTrial,
      subActive,
      subCancelled,
    ] = await Promise.all([
      prisma.household.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.bill.count({ where: { deletedAt: null } }),
      prisma.chore.count({ where: { deletedAt: null } }),
      prisma.shoppingList.count({ where: { deletedAt: null } }),
      prisma.appliance.count({ where: { deletedAt: null, isActive: true } }),
      prisma.documentArchive.count({ where: { deletedAt: null } }),
      prisma.householdMember.count({ where: { role: 'OWNER' } }),
      prisma.householdMember.count({ where: { role: 'ADMIN' } }),
      prisma.householdMember.count({ where: { role: 'MEMBER' } }),
      prisma.householdMember.count({ where: { role: 'CHILD' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.billPayment.count({ where: { paidAt: { gte: sevenDaysAgo } } }),
      prisma.choreExecution.count({ where: { executedAt: { gte: sevenDaysAgo } } }),
      prisma.documentArchive.count({ where: { uploadedAt: { gte: sevenDaysAgo } } }),
      // active users = أعضاء نفّذوا أي شيء آخر 30 يوم
      prisma.householdMember.count({
        where: {
          OR: [
            { invitedAt: { gte: thirtyDaysAgo } },
            { joinedAt: { gte: thirtyDaysAgo } },
          ],
        },
      }),
      prisma.household.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
      }),
      prisma.billPayment.findMany({
        where: { paidAt: { gte: sevenDaysAgo } },
        orderBy: { paidAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          paidAt: true,
          bill: { select: { title: true, householdId: true } },
        },
      }),
      prisma.choreExecution.findMany({
        where: { executedAt: { gte: sevenDaysAgo } },
        orderBy: { executedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          executedAt: true,
          chore: { select: { name: true, householdId: true } },
        },
      }),
      prisma.householdMember.findMany({
        where: { joinedAt: { gte: sevenDaysAgo } },
        orderBy: { joinedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          joinedAt: true,
          role: true,
          householdId: true,
          user: { select: { name: true } },
        },
      }),
      prisma.household.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.subscription.count({ where: { status: 'IN_TRIAL' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
    ]);

    // دمج النشاطات وفرزها
    const activity: AdminStats['recentActivity'] = [
      ...recentHouseholdsForActivity.map((h) => ({
        id: `h-${h.id}`,
        type: 'household_created' as const,
        description: h.name,
        timestamp: h.createdAt,
        householdId: h.id,
      })),
      ...recentBillPayments.map((p) => ({
        id: `p-${p.id}`,
        type: 'bill_paid' as const,
        description: `${p.bill.title} (${Number(p.amount).toFixed(2)} ر.س)`,
        timestamp: p.paidAt,
        householdId: p.bill.householdId,
      })),
      ...recentChoreExecutions.map((e) => ({
        id: `e-${e.id}`,
        type: 'chore_done' as const,
        description: e.chore.name,
        timestamp: e.executedAt,
        householdId: e.chore.householdId,
      })),
      ...recentMembers.map((m) => ({
        id: `m-${m.id}`,
        type: 'member_joined' as const,
        description: `${m.user.name} (${m.role.toLowerCase()})`,
        timestamp: m.joinedAt,
        householdId: m.householdId,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return {
      totals: {
        households: householdsCount,
        users: usersCount,
        bills: billsCount,
        chores: choresCount,
        shoppingLists: shoppingListsCount,
        appliances: appliancesCount,
        archive: archiveCount,
      },
      usersByRole: {
        OWNER: ownersCount,
        ADMIN: adminsCount,
        MEMBER: membersCount,
        CHILD: childrenCount,
      },
      signups: {
        today: signupsToday,
        last7Days: signupsLast7,
        last30Days: signupsLast30,
      },
      activity: {
        billsPaidLast7Days: billsPaidLast7,
        choresExecutedLast7Days: choresExecutedLast7,
        documentsUploadedLast7Days: documentsUploadedLast7,
        activeUsersLast30Days: activeUsersLast30,
      },
      recentHouseholds: recentHouseholdsRaw.map((h) => ({
        id: h.id,
        name: h.name,
        createdAt: h.createdAt,
        membersCount: h._count.members,
      })),
      recentActivity: activity,
      subscription: {
        inTrial: subInTrial,
        active: subActive,
        cancelled: subCancelled,
      },
    };
  }
}
