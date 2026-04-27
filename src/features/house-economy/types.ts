/**
 * Types — وحدة اقتصاد البيت
 */

import type { JobMenuItem, JobInstance, ChildWallet, SavingsGoal, WalletTransaction } from '@prisma/client';

export interface JobMenuItemWithStats extends JobMenuItem {
  activeInstancesCount: number;
  completedThisWeek: number;
}

export interface JobInstanceWithDetails extends JobInstance {
  jobMenuItem: Pick<JobMenuItem, 'id' | 'title' | 'iconEmoji' | 'reward' | 'difficulty'>;
  childName: string;
}

export interface ChildWalletWithDetails extends ChildWallet {
  memberId: string;
  memberName: string;
  memberAge: number | null;
  goals: SavingsGoal[];
  recentTransactions: WalletTransaction[];
}

export interface WalletSummary {
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
  totalSaved: number;
  totalCharity: number;
  children: Array<{
    memberId: string;
    name: string;
    balance: number;
  }>;
}
