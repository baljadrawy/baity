/**
 * Camera Abstraction — كاميرا (Web → Capacitor)
 *
 * يعمل على الويب عبر <input type="file"> والـ MediaDevices API.
 * عند تغليف التطبيق بـ Capacitor، يُستبدَل بـ @capacitor/camera.
 *
 * Reference: EXECUTION_PLAN_V2.md — Native Abstractions
 */

export interface CapturedPhoto {
  dataUrl: string;       // base64 data URL
  mimeType: string;      // image/jpeg أو image/png
  blob: Blob;
  fileName: string;
}

export interface CameraOptions {
  quality?: number;        // 0-100 (default: 85)
  maxWidth?: number;       // px
  maxHeight?: number;      // px
  allowGallery?: boolean;  // السماح باختيار من المعرض
}

/**
 * يفتح الكاميرا أو معرض الصور ويُرجع الصورة.
 * يعمل على الويب فقط — سيُحسَّن لاحقاً بـ Capacitor Camera plugin.
 */
export async function takePhoto(options: CameraOptions = {}): Promise<CapturedPhoto> {
  const { quality = 85, maxWidth = 1920, maxHeight = 1920, allowGallery = true } = options;

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.capture = allowGallery ? '' : 'environment'; // كاميرا خلفية

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('لم يتم اختيار صورة'));
        return;
      }

      try {
        const resized = await resizeImage(file, maxWidth, maxHeight, quality);
        resolve(resized);
      } catch (err) {
        reject(err);
      }
    };

    input.oncancel = () => reject(new Error('تم إلغاء الكاميرا'));

    input.click();
  });
}

/**
 * ضغط وتصغير الصورة قبل الرفع
 */
async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<CapturedPhoto> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // حساب الأبعاد مع الحفاظ على النسبة
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('فشل ضغط الصورة'));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              dataUrl: reader.result as string,
              mimeType: 'image/jpeg',
              blob,
              fileName: `photo_${Date.now()}.jpg`,
            });
          };
          reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality / 100
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('فشل تحميل الصورة'));
    };

    img.src = url;
  });
}

/**
 * رفع الصورة إلى Supabase Storage
 * TODO: سيُنقَل لـ core/storage عند ربط Supabase
 */
export async function uploadPhoto(
  photo: CapturedPhoto,
  bucket: string,
  path: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', photo.blob, photo.fileName);
  formData.append('bucket', bucket);
  formData.append('path', path);

  const res = await fetch('/api/v1/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) throw new Error('فشل رفع الصورة');

  const { url } = (await res.json()) as { url: string };
  return url;
}
