/**
 * Shopping Repository — طبقة Data Access لقوائم التسوق
 *
 * مبني على schema.prisma الفعلي:
 * - ShoppingList: id, householdId, name, isShared, createdAt, updatedAt, deletedAt
 * - ShoppingItem: id, listId, name, category, quantity, unit, estimatedPrice,
 *                 urgency, store, isChecked, addedById, checkedById, checkedAt
 */

import { prisma } from '@/core/db/prisma';
import type { ShoppingList, ShoppingItem } from '@prisma/client';
import type {
  CreateShoppingListInput,
  UpdateShoppingListInput,
  CreateShoppingItemInput,
  UpdateShoppingItemInput,
} from '../schemas';
import type { ShoppingListWithMeta, ShoppingSummary } from '../types';

export class ShoppingRepository {
  constructor(private readonly householdId: string) {}

  // ============================================================
  // Lists
  // ============================================================

  async listLists(filters?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ShoppingListWithMeta[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      householdId: this.householdId,
      deletedAt: null,
      ...(filters?.search && {
        name: { contains: filters.search, mode: 'insensitive' as const },
      }),
    };

    const [lists, total] = await prisma.$transaction([
      prisma.shoppingList.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { items: true },
      }),
      prisma.shoppingList.count({ where }),
    ]);

    const data = lists.map((list) => this._addMeta(list));
    return { data, total };
  }

  async findListById(id: string): Promise<ShoppingListWithMeta | null> {
    const list = await prisma.shoppingList.findFirst({
      where: { id, householdId: this.householdId, deletedAt: null },
      include: {
        items: { orderBy: [{ isChecked: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!list) return null;
    return this._addMeta(list);
  }

  async getSummary(): Promise<ShoppingSummary> {
    const [activeListsCount, totalPendingItems, estimatedAgg] = await prisma.$transaction([
      prisma.shoppingList.count({
        where: { householdId: this.householdId, deletedAt: null },
      }),
      prisma.shoppingItem.count({
        where: {
          list: { householdId: this.householdId, deletedAt: null },
          isChecked: false,
        },
      }),
      prisma.shoppingItem.aggregate({
        where: {
          list: { householdId: this.householdId, deletedAt: null },
          isChecked: false,
        },
        _sum: { estimatedPrice: true },
      }),
    ]);

    return {
      activeListsCount,
      totalPendingItems,
      totalEstimatedCost: Number(estimatedAgg._sum.estimatedPrice ?? 0),
    };
  }

  // ============================================================
  // List Mutations
  // ============================================================

  async createList(data: CreateShoppingListInput, _addedById: string): Promise<ShoppingList> {
    return prisma.shoppingList.create({
      data: {
        householdId: this.householdId,
        name: data.name,
        isShared: data.isShared,
      },
    });
  }

  async updateList(id: string, data: UpdateShoppingListInput): Promise<ShoppingList> {
    return prisma.shoppingList.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteList(id: string): Promise<void> {
    await prisma.shoppingList.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ============================================================
  // Items
  // ============================================================

  async addItem(
    listId: string,
    data: CreateShoppingItemInput,
    addedById: string
  ): Promise<ShoppingItem> {
    return prisma.shoppingItem.create({
      data: {
        listId,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        estimatedPrice: data.estimatedPrice,
        urgency: data.urgency,
        store: data.store,
        addedById,
      },
    });
  }

  async updateItem(itemId: string, data: UpdateShoppingItemInput): Promise<ShoppingItem> {
    return prisma.shoppingItem.update({
      where: { id: itemId },
      data: { ...data },
    });
  }

  async checkItem(itemId: string, checkedById: string): Promise<ShoppingItem> {
    return prisma.shoppingItem.update({
      where: { id: itemId },
      data: {
        isChecked: true,
        checkedById,
        checkedAt: new Date(),
      },
    });
  }

  async uncheckItem(itemId: string): Promise<ShoppingItem> {
    return prisma.shoppingItem.update({
      where: { id: itemId },
      data: { isChecked: false, checkedById: null, checkedAt: null },
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    await prisma.shoppingItem.delete({ where: { id: itemId } });
  }

  /** إكمال القائمة — تشتري كل العناصر */
  async checkAllItems(listId: string, memberId: string): Promise<void> {
    await prisma.shoppingItem.updateMany({
      where: { listId, isChecked: false },
      data: { isChecked: true, checkedById: memberId, checkedAt: new Date() },
    });
  }

  // ============================================================
  // Private helpers
  // ============================================================

  private _addMeta(list: ShoppingList & { items: ShoppingItem[] }): ShoppingListWithMeta {
    const totalItems = list.items.length;
    const checkedItems = list.items.filter((i) => i.isChecked).length;
    const estimatedTotal = list.items.reduce(
      (sum, i) => sum + Number(i.estimatedPrice ?? 0),
      0
    );
    return {
      ...list,
      totalItems,
      checkedItems,
      estimatedTotal,
      completionRate: totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100),
    };
  }
}
