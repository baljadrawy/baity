'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type {
  CreateArchiveInput,
  UpdateArchiveInput,
} from '../schemas';
import type { ArchiveItemView } from '../api/repository';

export const archiveKeys = {
  all: ['archive'] as const,
  lists: () => [...archiveKeys.all, 'list'] as const,
  list: (f?: Record<string, unknown>) => [...archiveKeys.lists(), f] as const,
};

interface ArchiveFiltersUI {
  category?: string;
  search?: string;
  expiringSoon?: boolean;
  [key: string]: unknown;
}

export function useArchive(filters?: ArchiveFiltersUI) {
  return useQuery({
    queryKey: archiveKeys.list(filters),
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.category) p.set('category', filters.category);
      if (filters?.search) p.set('search', filters.search);
      if (filters?.expiringSoon) p.set('expiringSoon', 'true');
      return api.get<{ data: ArchiveItemView[]; total: number }>(
        `/archive?${p.toString()}`
      );
    },
    staleTime: 60_000,
  });
}

export function useCreateArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArchiveInput) =>
      api.post<{ data: ArchiveItemView }>('/archive', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: archiveKeys.all }),
  });
}

export function useUpdateArchive(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateArchiveInput) =>
      api.patch(`/archive/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: archiveKeys.all }),
  });
}

export function useDeleteArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/archive/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: archiveKeys.all }),
  });
}
