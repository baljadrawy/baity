/**
 * Supabase Storage wrapper — "بيتي"
 *
 * مغلِّف رفيع حول Supabase Storage:
 * - يستخدم service-role key (server-side فقط)
 * - bucket: STORAGE_BUCKET_HOUSEHOLDS (private)
 * - signed URLs لقراءة الملفات (لا public access)
 *
 * يُستخدم من API routes فقط (بعد authenticate() + multi-tenancy check).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase storage not configured: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required'
    );
  }

  _client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/** اسم الـ bucket — افتراضي 'households' */
function getBucket(): string {
  return process.env['STORAGE_BUCKET_HOUSEHOLDS'] ?? 'households';
}

export interface UploadResult {
  /** المسار داخل الـ bucket (يُحفظ في DB) */
  path: string;
  /** signed URL صالح للقراءة (للعرض الفوري) */
  signedUrl: string;
  /** الحجم بالبايت بعد المعالجة */
  size: number;
}

/**
 * يرفع ملف للـ Storage.
 * @param path المسار داخل الـ bucket (مثلاً "{householdId}/appliances/{id}.jpg")
 * @param buffer محتوى الملف
 * @param contentType MIME type
 */
export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const supabase = getClient();
  const bucket = getBucket();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`storage upload failed: ${uploadError.message}`);
  }

  const signedUrl = await createSignedUrl(path, 60 * 60); // 1 hour

  return {
    path,
    signedUrl,
    size: buffer.length,
  };
}

/**
 * يولّد signed URL لقراءة ملف.
 * @param path المسار في الـ bucket
 * @param expiresInSeconds مدة الصلاحية (افتراضي 1 ساعة)
 */
export async function createSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = getClient();
  const bucket = getBucket();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`signed URL generation failed: ${error?.message ?? 'unknown'}`);
  }

  return data.signedUrl;
}

/**
 * يحذف ملف من الـ Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = getClient();
  const bucket = getBucket();

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`storage delete failed: ${error.message}`);
  }
}

/**
 * يولّد مساراً آمناً داخل الـ bucket مع householdId scoping.
 * @example
 * buildScopedPath('h_abc', 'appliances', 'photo.jpg') // 'h_abc/appliances/<cuid>.jpg'
 */
export function buildScopedPath(
  householdId: string,
  category: string,
  fileNameOrExt: string
): string {
  // يُولِّد cuid قصير للخصوصية (لا يُكشف اسم الملف الأصلي)
  const random = Math.random().toString(36).slice(2, 11);
  const ext = fileNameOrExt.includes('.')
    ? fileNameOrExt.split('.').pop()
    : fileNameOrExt;
  const cleanCategory = category.replace(/[^a-z0-9_-]/gi, '');
  return `${householdId}/${cleanCategory}/${Date.now()}_${random}.${ext}`;
}
