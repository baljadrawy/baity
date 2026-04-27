/**
 * EXIF Stripping — إزالة بيانات الصور
 *
 * إزالة بيانات EXIF من الصور المرفوعة لحماية:
 * - الموقع الجغرافي (GPS coordinates)
 * - معلومات الجهاز
 * - بيانات شخصية مُضمَّنة
 *
 * مهم جداً لصور الأطفال (Golden Rule #4 — Security)
 *
 * يستخدم sharp (مثبّت في package.json)
 */

import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  sizeBytes: number;
}

/** أنواع MIME المسموح بها */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** الحد الأقصى للحجم: 10MB */
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** أبعاد قصوى */
const MAX_DIMENSION = 4096;

/**
 * يتحقق من صحة الصورة ويُزيل EXIF ويُضغطها
 */
export async function processAndStripImage(
  input: Buffer | Uint8Array,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = MAX_DIMENSION,
    maxHeight = MAX_DIMENSION,
    quality = 85,
    format = 'jpeg',
  } = options;

  if (input.length > MAX_SIZE_BYTES) {
    throw new Error(`حجم الصورة يتجاوز الحد المسموح (${MAX_SIZE_BYTES / 1024 / 1024}MB)`);
  }

  // التحقق من magic bytes (file signature) — ليس MIME فقط
  const buf = Buffer.from(input);
  if (!isValidImageMagicBytes(buf)) {
    throw new Error('صيغة الملف غير مدعومة أو مشبوهة');
  }

  const image = sharp(buf)
    .withMetadata({ exif: {} }) // مسح EXIF بالكامل (GPS، الجهاز، etc.)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

  let outputBuffer: Buffer;
  let mimeType: ProcessedImage['mimeType'];

  switch (format) {
    case 'png':
      outputBuffer = await image.png({ compressionLevel: 8 }).toBuffer();
      mimeType = 'image/png';
      break;
    case 'webp':
      outputBuffer = await image.webp({ quality }).toBuffer();
      mimeType = 'image/webp';
      break;
    default:
      outputBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
      mimeType = 'image/jpeg';
  }

  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    mimeType,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    sizeBytes: outputBuffer.length,
  };
}

/**
 * التحقق من magic bytes للصور الشائعة
 */
function isValidImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 4) return false;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;

  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;

  // WebP: 52 49 46 46 (RIFF)
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true;

  return false;
}

export { ALLOWED_MIME_TYPES };
