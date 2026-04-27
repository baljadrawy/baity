/**
 * Types — وحدة المشتريات
 * مبنية على prisma/schema.prisma الفعلي
 */

import type { ShoppingList, ShoppingItem } from '@prisma/client';

export interface ShoppingListWithMeta extends ShoppingList {
  items: ShoppingItem[];
  totalItems: number;
  checkedItems: number;
  estimatedTotal: number;
  completionRate: number; // 0-100
}

export interface ShoppingSummary {
  activeListsCount: number;
  totalPendingItems: number;
  totalEstimatedCost: number;
}
