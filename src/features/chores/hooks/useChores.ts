/**
 * TanStack Query Hooks — وحدة المهام الدورية
 *
 * - useChores: قائمة المهام
 * - useChore: مهمة واحدة
 * - useCreateChore: إنشاء مهمة
 * - useExecuteChore: تنفيذ مهمة (optimistic update)
 * - useDeleteChore: حذف مهمة
 */

'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CreateChoreInput, ExecuteChoreInput } from '../schemas';

// ============================================================
// Types (مؤقتة — ستُنقل لـ types/index.ts لاحقاً)
// ============================================================

interface Chore {
  id: string;
  name: string;
  description?: string | null;
  periodType: string;
  periodDays?: number | null;
  assignmentType: string;
  nextDueDate?: string | null;
  assignedMemberIds: string[];
  assignedMemberNames: string[];
  isOverdue: boolean;
  daysUntilDue?: number | null;
}

interface ChoresResponse {
  data: Chore[];
  total: number;
}

// ============================================================
// Query Keys
// ============================================================

export const choreKeys = {
  all: ['chores'] as const,
  lists: () => [...choreKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...choreKeys.lists(), filters] as const,
  details: () => [...choreKeys.all, 'detail'] as const,
  detail: (id: string) => [...choreKeys.details(), id] as const,
};

// ============================================================
// Queries
// ============================================================

export function useChores(
  filters?: { status?: string; search?: string; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<ChoresResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: choreKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      return api.get<ChoresResponse>(`/chores?${params.toString()}`);
    },
    staleTime: 60_000,
    ...options,
  });
}

export function useChore(
  id: string,
  options?: Omit<UseQueryOptions<Chore>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: choreKeys.detail(id),
    queryFn: () => api.get<Chore>(`/chores/${id}`),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });
}

// ============================================================
// Mutations
// ============================================================

export function useCreateChore() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChoreInput) => api.post<Chore>('/chores', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });
}

/**
 * تنفيذ مهمة مع Optimistic Update
 * يُحدّث nextDueDate و isOverdue فوراً
 */
export function useExecuteChore(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: ExecuteChoreInput) => api.post<Chore>(`/chores/${id}/execute`, data),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: choreKeys.detail(id) });
      const previous = qc.getQueryData<Chore>(choreKeys.detail(id));

      // Optimistic: صفّر حالة التأخير
      qc.setQueryData<Chore>(choreKeys.detail(id), (old) =>
        old ? { ...old, isOverdue: false, daysUntilDue: null } : old
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(choreKeys.detail(id), context.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: choreKeys.detail(id) });
      qc.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });
}

export function useDeleteChore() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/chores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: choreKeys.lists() });
    },
  });
}
