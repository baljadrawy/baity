/**
 * Members hooks — TanStack Query
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type {
  CreateMemberInput,
  UpdateMemberInput,
  SetMemberPinInput,
} from '../schemas';
import type { MemberView } from '../api/repository';

export const memberKeys = {
  all: ['members'] as const,
  list: () => [...memberKeys.all, 'list'] as const,
};

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.list(),
    queryFn: () => api.get<{ data: MemberView[] }>('/members'),
    staleTime: 60_000,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberInput) =>
      api.post<{ data: MemberView }>('/members', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  });
}

export function useUpdateMember(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMemberInput) =>
      api.patch<{ data: MemberView }>(`/members/${memberId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.delete(`/members/${memberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  });
}

export function useSetMemberPin(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetMemberPinInput) =>
      api.post(`/members/${memberId}/pin`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  });
}
