'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { FamilyBankSummary } from '../api/repository';

export const familyBankKeys = {
  all: ['familyBank'] as const,
  summary: () => [...familyBankKeys.all, 'summary'] as const,
};

export function useFamilyBank() {
  return useQuery({
    queryKey: familyBankKeys.summary(),
    queryFn: () => api.get<{ data: FamilyBankSummary }>('/family-bank'),
    staleTime: 60_000,
  });
}
