/**
 * TanStack Query Hooks — وحدة اقتصاد البيت
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type {
  CreateJobMenuItemInput,
  StartJobInput,
  SubmitJobInput,
  ApproveJobInput,
  RejectJobInput,
  UpdateWalletDistributionInput,
  CreateSavingsGoalInput,
} from '../schemas';

// ============================================================
// Query Keys
// ============================================================

export const houseEconomyKeys = {
  all: ['houseEconomy'] as const,
  jobs: () => [...houseEconomyKeys.all, 'jobs'] as const,
  jobsList: (f?: Record<string, unknown>) => [...houseEconomyKeys.jobs(), 'list', f] as const,
  jobDetail: (id: string) => [...houseEconomyKeys.jobs(), id] as const,
  instances: (f?: Record<string, unknown>) => [...houseEconomyKeys.all, 'instances', f] as const,
  pending: () => [...houseEconomyKeys.all, 'pending'] as const,
  wallet: () => [...houseEconomyKeys.all, 'wallet'] as const,
  childWallet: (memberId: string) => [...houseEconomyKeys.wallet(), memberId] as const,
};

// ============================================================
// Job Menu Items
// ============================================================

export function useJobMenuItems(filters?: { isActive?: boolean; childId?: string; search?: string }) {
  return useQuery({
    queryKey: houseEconomyKeys.jobsList(filters),
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.isActive === false) p.set('isActive', 'false');
      if (filters?.childId) p.set('childId', filters.childId);
      if (filters?.search) p.set('search', filters.search);
      return api.get<{ data: unknown[] }>(`/house-economy/jobs?${p.toString()}`);
    },
    staleTime: 2 * 60_000,
  });
}

export function useCreateJobMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobMenuItemInput) => api.post('/house-economy/jobs', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: houseEconomyKeys.jobs() }),
  });
}

export function useUpdateJobMenuItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateJobMenuItemInput>) => api.patch(`/house-economy/jobs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: houseEconomyKeys.jobs() }),
  });
}

export function useDeleteJobMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/house-economy/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: houseEconomyKeys.jobs() }),
  });
}

// ============================================================
// Job Instances
// ============================================================

export function useJobInstances(filters?: { childId?: string; status?: string }) {
  return useQuery({
    queryKey: houseEconomyKeys.instances(filters),
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters?.childId) p.set('childId', filters.childId);
      if (filters?.status) p.set('status', filters.status);
      return api.get<{ data: unknown[] }>(`/house-economy/instances?${p.toString()}`);
    },
    staleTime: 30_000,
  });
}

export function useStartJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StartJobInput) => api.post('/house-economy/instances', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseEconomyKeys.instances() });
      qc.invalidateQueries({ queryKey: houseEconomyKeys.jobs() });
    },
  });
}

export function useSubmitJob(instanceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitJobInput) =>
      api.post(`/house-economy/instances/${instanceId}/submit`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseEconomyKeys.instances() });
      qc.invalidateQueries({ queryKey: houseEconomyKeys.pending() });
    },
  });
}

// ============================================================
// Approvals
// ============================================================

export function usePendingApprovals() {
  return useQuery({
    queryKey: houseEconomyKeys.pending(),
    queryFn: () => api.get<{ data: unknown[] }>('/house-economy/pending'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useApproveJob(instanceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApproveJobInput) =>
      api.post(`/house-economy/instances/${instanceId}/approve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseEconomyKeys.pending() });
      qc.invalidateQueries({ queryKey: houseEconomyKeys.instances() });
      qc.invalidateQueries({ queryKey: houseEconomyKeys.wallet() });
    },
  });
}

export function useRejectJob(instanceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RejectJobInput) =>
      api.post(`/house-economy/instances/${instanceId}/reject`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseEconomyKeys.pending() });
      qc.invalidateQueries({ queryKey: houseEconomyKeys.instances() });
    },
  });
}

// ============================================================
// Wallet
// ============================================================

export function useWalletSummary() {
  return useQuery({
    queryKey: houseEconomyKeys.wallet(),
    queryFn: () => api.get('/house-economy/wallet'),
    staleTime: 60_000,
  });
}

export function useChildWallet(memberId: string) {
  return useQuery({
    queryKey: houseEconomyKeys.childWallet(memberId),
    queryFn: () => api.get(`/house-economy/wallet/${memberId}`),
    enabled: !!memberId,
    staleTime: 60_000,
  });
}

export function useUpdateWalletDistribution(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWalletDistributionInput) =>
      api.patch(`/house-economy/wallet/${memberId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: houseEconomyKeys.childWallet(memberId) }),
  });
}

export function useCreateSavingsGoal(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSavingsGoalInput) =>
      api.post(`/house-economy/wallet/${memberId}/goals`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: houseEconomyKeys.childWallet(memberId) }),
  });
}

export function useUpdateSavingsGoal(memberId: string, goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateSavingsGoalInput>) =>
      api.patch(`/house-economy/wallet/${memberId}/goals/${goalId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: houseEconomyKeys.childWallet(memberId) }),
  });
}

export function useDeleteSavingsGoal(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) =>
      api.delete(`/house-economy/wallet/${memberId}/goals/${goalId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: houseEconomyKeys.childWallet(memberId) }),
  });
}
