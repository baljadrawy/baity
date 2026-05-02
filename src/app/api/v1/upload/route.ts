/**
 * POST /api/v1/upload — رفع ملف عام (صورة/PDF) للـ Storage
 *
 * الأمان (Golden Rule #4):
 * - authenticate() إجباري
 * - rate limiting
 * - MIME whitelist
 * - magic byte verification
 * - حجم محدود
 * - EXIF stripping للصور (GPS، الجهاز)
 * - مسار مُحدَّد بالـ householdId (multi-tenancy)
 *
 * Body: FormData
 *   - file: Blob (image/jpeg|png|webp|application/pdf)
 *   - category: string (e.g. 'appliances', 'bills', 'documents', 'avatar')
 *
 * Response: { path, url, size, mimeType, fileName }
 *   - path: المسار داخل الـ bucket (يُحفظ في DB)
 *   - url: signed URL للعرض الفوري (1 ساعة)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { processAndStripImage } from '@/core/security/exif-strip';
import { uploadFile, buildScopedPath } from '@/core/storage';

/** أنواع MIME المسموح بها */
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_PDF_MIME = 'application/pdf';

/** الحد الأقصى للحجم: 10MB صور، 20MB PDF */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_SIZE = 20 * 1024 * 1024;

/** فئات مسموح بها — تُستخدم في المسار */
const ALLOWED_CATEGORIES = new Set([
  'appliances',
  'bills',
  'documents',
  'avatar',
  'job-photos',
]);

/** التحقق من magic bytes للـ PDF */
function isValidPdfMagicBytes(buf: Buffer): boolean {
  // PDF: 25 50 44 46 ('%PDF')
  return (
    buf.length >= 4 &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) {
      return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
    }

    // 2. Auth
    const session = await authenticate(req);

    // 3. Parse FormData
    const formData = await req.formData();
    const fileEntry = formData.get('file');
    const category = String(formData.get('category') ?? 'documents');

    if (!(fileEntry instanceof Blob)) {
      return NextResponse.json({ error: 'file_required' }, { status: 400 });
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
    }

    // 4. Read file
    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const incomingMime = fileEntry.type;
    const fileName =
      fileEntry instanceof File
        ? fileEntry.name.replace(/[^a-z0-9_.-]/gi, '_')
        : 'file';

    // 5. Validate MIME + size + magic bytes
    let processedBuffer: Buffer;
    let finalMime: string;
    let finalExt: string;

    if (ALLOWED_IMAGE_MIME.has(incomingMime)) {
      if (buffer.length > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
      }

      // EXIF strip + magic verification + resize (≤ 4096) داخل المعالج
      const processed = await processAndStripImage(buffer, {
        format: 'jpeg',
        quality: 88,
      });
      processedBuffer = processed.buffer;
      finalMime = processed.mimeType;
      finalExt = 'jpg';
    } else if (incomingMime === ALLOWED_PDF_MIME) {
      if (buffer.length > MAX_PDF_SIZE) {
        return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
      }
      if (!isValidPdfMagicBytes(buffer)) {
        return NextResponse.json({ error: 'invalid_file' }, { status: 400 });
      }
      processedBuffer = buffer;
      finalMime = ALLOWED_PDF_MIME;
      finalExt = 'pdf';
    } else {
      return NextResponse.json({ error: 'unsupported_mime' }, { status: 415 });
    }

    // 6. Upload to Supabase Storage
    const path = buildScopedPath(session.householdId, category, finalExt);
    const result = await uploadFile(path, processedBuffer, finalMime);

    return NextResponse.json(
      {
        path: result.path,
        url: result.signedUrl,
        size: result.size,
        mimeType: finalMime,
        fileName,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}

/** زِيادة حد الـ body للـ App Router (FormData uploads) */
export const runtime = 'nodejs';
export const maxDuration = 60;
