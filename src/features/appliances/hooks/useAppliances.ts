/**
 * TanStack Query Hooks — وحدة الأجهزة والضمانات
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CreateApplianceInput, UpdateApplianceInput, CreateMaintenanceScheduleInput } from '../schemas';
import type { ApplianceWithMeta } from '../api/repository';

export const applianceKeys = {
  all: ['appliances'] as const,
  lists: () => [...applianceKeys.all, 'list'] as const,
  list: (f?: Record<string, unknown>) => [...applianceKeys.lists(), f] as const,
  detail: (id: string) => [...applianceKeys.all, id] as const,
};

export function useAppliances(filters?: { search?: string; category?: string; expiringSoon?: boolean }) {
  return useQuery({
    queryKey: applianceKeys.list(filters),
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.search) p.set('search', filters.search);
      if (filters?.category) p.set('category', filters.category);
      if (filters?.expiringSoon) p.set('expiringSoon', 'true');
      return api.get<{ data: ApplianceWithMeta[]; total: number }>(`/appliances?${p.toString()}`);
    },
    staleTime: 2 * 60_000,
  });
}

export function useAppliance(id: string) {
  return useQuery({
    queryKey: applianceKeys.detail(id),
    queryFn: () => api.get<{ data: ApplianceWithMeta }>(`/appliances/${id}`),
    enabled: !!id,
    staleTime: 2 * 60_000,
  });
}

export function useCreateAppliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApplianceInput) => api.post('/appliances', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: applianceKeys.lists() }),
  });
}

export function useUpdateAppliance(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplianceInput) => api.patch(`/appliances/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applianceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: applianceKeys.lists() });
    },
  });
}

export function useDeleteAppliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/appliances/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: applianceKeys.lists() }),
  });
}

export function useAddMaintenanceSchedule(applianceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaintenanceScheduleInput) =>
      api.post(`/appliances/${applianceId}/maintenance`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: applianceKeys.detail(applianceId) }),
  });
}
