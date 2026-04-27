/**
 * TanStack Query Hooks — وحدة المشتريات
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CreateShoppingListInput, CreateShoppingItemInput, UpdateShoppingItemInput } from '../schemas';
import type { ShoppingListWithMeta, ShoppingSummary } from '../types';

export const shoppingKeys = {
  all: ['shopping'] as const,
  lists: () => [...shoppingKeys.all, 'lists'] as const,
  list: (filters?: Record<string, unknown>) => [...shoppingKeys.lists(), filters] as const,
  detail: (id: string) => [...shoppingKeys.all, 'detail', id] as const,
  summary: () => [...shoppingKeys.all, 'summary'] as const,
};

// ============================================================
// Lists
// ============================================================

export function useShoppingLists(filters?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: shoppingKeys.list(filters),
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.search) p.set('search', filters.search);
      if (filters?.page) p.set('page', String(filters.page));
      return api.get<{ data: ShoppingListWithMeta[]; total: number }>(`/shopping?${p.toString()}`);
    },
    staleTime: 30_000,
  });
}

export function useShoppingList(id: string) {
  return useQuery({
    queryKey: shoppingKeys.detail(id),
    queryFn: () => api.get<{ data: ShoppingListWithMeta }>(`/shopping/${id}`),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useShoppingSummary() {
  return useQuery({
    queryKey: shoppingKeys.summary(),
    queryFn: () => api.get<ShoppingSummary>('/shopping/summary'),
    staleTime: 60_000,
  });
}

export function useCreateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShoppingListInput) => api.post('/shopping', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingKeys.lists() }),
  });
}

export function useDeleteShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/shopping/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingKeys.lists() }),
  });
}

// ============================================================
// Items — Optimistic Updates للـ check/uncheck
// ============================================================

export function useAddShoppingItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShoppingItemInput) =>
      api.post(`/shopping/${listId}/items`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingKeys.detail(listId) }),
  });
}

export function useCheckShoppingItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      api.patch(`/shopping/${listId}/items/${itemId}`, { isChecked }),

    onMutate: async ({ itemId, isChecked }) => {
      await qc.cancelQueries({ queryKey: shoppingKeys.detail(listId) });
      const previous = qc.getQueryData(shoppingKeys.detail(listId));

      // Optimistic: toggle isChecked فوراً
      qc.setQueryData<{ data: ShoppingListWithMeta }>(
        shoppingKeys.detail(listId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map((item) =>
                item.id === itemId ? { ...item, isChecked } : item
              ),
            },
          };
        }
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(shoppingKeys.detail(listId), context.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: shoppingKeys.detail(listId) });
      qc.invalidateQueries({ queryKey: shoppingKeys.summary() });
    },
  });
}

export function useDeleteShoppingItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/shopping/${listId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingKeys.detail(listId) }),
  });
}

export function useCheckAllItems(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/shopping/${listId}/check-all`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingKeys.detail(listId) });
      qc.invalidateQueries({ queryKey: shoppingKeys.summary() });
    },
  });
}
