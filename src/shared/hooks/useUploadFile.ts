/**
 * useUploadFile — Hook لرفع ملف للـ Storage
 *
 * يلتف على /api/v1/upload (POST FormData)
 * Returns: { upload, isPending, error }
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { ApiError, NetworkError } from '@/shared/lib/api-client';

export interface UploadResponse {
  path: string;
  url: string;
  size: number;
  mimeType: string;
  fileName: string;
}

export type UploadCategory =
  | 'appliances'
  | 'bills'
  | 'documents'
  | 'avatar'
  | 'job-photos';

interface UploadInput {
  file: File;
  category: UploadCategory;
}

async function uploadFile({ file, category }: UploadInput): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  let res: Response;
  try {
    res = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
  } catch {
    throw new NetworkError();
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? `upload_failed_${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as UploadResponse;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: uploadFile,
  });
}
