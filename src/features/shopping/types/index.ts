/**
 * Types — وحدة التسوق
 */

import type { ShoppingList, ShoppingItem } from '@prisma/client';

// Re-export Prisma types
export type { ShoppingList, ShoppingItem };

/** قائمة مع إحصائيات */
export interface ShoppingListWithMeta extends ShoppingList {
  items: ShoppingItem[];
  totalItems: number;
  boughtItems: number;
  estimatedTotal: number;
  actualTotal: number;
  completionRate: number; // 0-100
}

/** ملخص للـ Dashboard */
export interface ShoppingSummary {
  activeListsCount: number;
  totalPendingItems: number;
  totalEstimatedCost: number;
}
