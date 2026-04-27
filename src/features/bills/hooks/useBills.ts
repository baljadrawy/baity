/**
 * TanStack Query Hooks — وحدة الفواتير
 *
 * - useBills: قائمة الفواتير مع فلترة
 * - useBill: فاتورة واحدة
 * - useBillsSummary: ملخص للـ Dashboard
 * - useCreateBill: إنشاء فاتورة
 * - useUpdateBill: تحديث فاتورة
 * - usePayBill: دفع فاتورة (optimistic update)
 * - useDeleteBill: حذف فاتورة (optimistic update)
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { BillWithMeta, BillsSummary } from '../types';
import type { CreateBillInput, UpdateBillInput, PayBillInput, BillFilters } from '../schemas';

// ============================================================
// Query Keys
// ============================================================

export const billKeys = {
  all: ['bills'] as const,
  lists: () => [...billKeys.all, 'list'] as const,
  list: (filters?: BillFilters) => [...billKeys.lists(), filters] as const,
  details: () => [...billKeys.all, 'detail'] as const,
  detail: (id: string) => [...billKeys.details(), id] as const,
  summary: () => [...billKeys.all, 'summary'] as const,
};

// ============================================================
// Queries
// ============================================================

interface BillsResponse {
  data: BillWithMeta[];
  total: number;
}

export function useBills(
  filters?: BillFilters,
  options?: Omit<UseQueryOptions<BillsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: billKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.status) params.set('status', filters.status);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.search) params.set('search', filters.search);
      return api.get<BillsResponse>(`/bills?${params.toString()}`);
    },
    staleTime: 60_000, // 1 دقيقة
    ...options,
  });
}

export function useBill(
  id: string,
  options?: Omit<UseQueryOptions<BillWithMeta>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: billKeys.detail(id),
    queryFn: () => api.get<BillWithMeta>(`/bills/${id}`),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });
}

export function useBillsSummary(
  options?: Omit<UseQueryOptions<BillsSummary>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: billKeys.summary(),
    queryFn: () => api.get<BillsSummary>('/bills/summary'),
    staleTime: 2 * 60_000, // 2 دقيقة
    ...options,
  });
}

// ============================================================
// Mutations
// ============================================================

export function useCreateBill() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBillInput) => api.post<BillWithMeta>('/bills', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billKeys.lists() });
      qc.invalidateQueries({ queryKey: billKeys.summary() });
    },
  });
}

export function useUpdateBill(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBillInput) => api.patch<BillWithMeta>(`/bills/${id}`, data),
    onSuccess: (updated) => {
      qc.setQueryData(billKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

/**
 * دفع فاتورة مع Optimistic Update
 * تُعلَّم الفاتورة كـ PAID فوراً في الـ UI قبل تأكيد الخادم
 */
export function usePayBill(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: PayBillInput) => api.post<BillWithMeta>(`/bills/${id}/pay`, data),

    onMutate: async () => {
      // إلغاء أي refetch جارٍ
      await qc.cancelQueries({ queryKey: billKeys.detail(id) });

      // حفظ snapshot للـ rollback
      const previous = qc.getQueryData<BillWithMeta>(billKeys.detail(id));

      // Optimistic update
      qc.setQueryData<BillWithMeta>(billKeys.detail(id), (old) =>
        old ? { ...old, status: 'PAID' as const } : old
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Rollback عند الفشل
      if (context?.previous) {
        qc.setQueryData(billKeys.detail(id), context.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: billKeys.detail(id) });
      qc.invalidateQueries({ queryKey: billKeys.lists() });
      qc.invalidateQueries({ queryKey: billKeys.summary() });
    },
  });
}

/**
 * حذف فاتورة مع Optimistic Update
 */
export function useDeleteBill() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/bills/${id}`),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: billKeys.lists() });

      // حفظ snapshot
      const previousLists = qc.getQueriesData<BillsResponse>({
        queryKey: billKeys.lists(),
      });

      // Optimistic: أزل الفاتورة من كل القوائم المُخزَّنة
      qc.setQueriesData<BillsResponse>({ queryKey: billKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((b) => b.id !== id),
          total: old.total - 1,
        };
      });

      return { previousLists };
    },

    onError: (_err, _id, context) => {
      if (context?.previousLists) {
        for (const [queryKey, data] of context.previousLists) {
          qc.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: billKeys.lists() });
      qc.invalidateQueries({ queryKey: billKeys.summary() });
    },
  });
}
