/**
 * useApplianceDocuments — TanStack Query hooks لوثائق الأجهزة
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';

export type DocumentType =
  | 'PURCHASE_INVOICE'
  | 'WARRANTY_CARD'
  | 'USER_MANUAL'
  | 'RECEIPT'
  | 'SERVICE_REPORT'
  | 'PRODUCT_PHOTO'
  | 'OTHER';

export interface ApplianceDocument {
  id: string;
  type: DocumentType;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedById: string;
  signedUrl: string | null;
}

interface CreateDocumentInput {
  type: DocumentType;
  title: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const applianceDocumentKeys = {
  all: (applianceId: string) => ['appliances', applianceId, 'documents'] as const,
};

export function useApplianceDocuments(applianceId: string) {
  return useQuery({
    queryKey: applianceDocumentKeys.all(applianceId),
    queryFn: () =>
      api.get<{ data: ApplianceDocument[] }>(`/appliances/${applianceId}/documents`),
    enabled: !!applianceId,
    staleTime: 60_000,
  });
}

export function useAddApplianceDocument(applianceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentInput) =>
      api.post(`/appliances/${applianceId}/documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applianceDocumentKeys.all(applianceId) });
      qc.invalidateQueries({ queryKey: ['appliances'] });
    },
  });
}

export function useDeleteApplianceDocument(applianceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      api.delete(`/appliances/${applianceId}/documents/${docId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applianceDocumentKeys.all(applianceId) });
      qc.invalidateQueries({ queryKey: ['appliances'] });
    },
  });
}
