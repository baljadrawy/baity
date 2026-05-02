/**
 * scripts/generate-pwa-icons.mjs
 *
 * يولّد كل أيقونات الـ PWA من ملف SVG واحد (`public/icons/icon-source.svg`).
 *
 * الاستخدام: `node scripts/generate-pwa-icons.mjs`
 * (يحتاج sharp — مثبَّتة كـ dependency أساسية في المشروع)
 *
 * الأحجام: 72/96/128/144/152/180/192/384/512
 *   + apple-touch-icon (180)
 *   + maskable للـ 192/512 (مع safe-area padding)
 *   + 3 shortcuts (96)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = resolve(ROOT, 'public/icons/icon-source.svg');
const OUT_DIR = resolve(ROOT, 'public/icons');

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

/** خلفية ذهبية صلبة للـ maskable (تملأ safe-area الكاملة) */
const MASKABLE_BG = '#c9a961';

async function main() {
  const svg = await readFile(SOURCE);
  await mkdir(OUT_DIR, { recursive: true });

  // أيقونات عادية (purpose=any)
  for (const size of SIZES) {
    await sharp(svg)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(resolve(OUT_DIR, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);
  }

  // apple-touch-icon (alias للـ 180)
  await sharp(svg)
    .resize(180, 180, { fit: 'contain' })
    .flatten({ background: '#ffffff' })
    .png({ compressionLevel: 9 })
    .toFile(resolve(OUT_DIR, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  // Maskable: SVG داخل safe-area (~80% من الأيقونة) مع خلفية ذهبية صلبة
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.78);
    const innerPng = await sharp(svg)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: MASKABLE_BG,
      },
    })
      .composite([{ input: innerPng, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(resolve(OUT_DIR, `icon-${size}-maskable.png`));
    console.log(`  ✓ icon-${size}-maskable.png`);
  }

  // Shortcuts — نفس المصدر بحجم 96
  for (const name of ['shortcut-bills', 'shortcut-chores', 'shortcut-shopping']) {
    await sharp(svg)
      .resize(96, 96, { fit: 'contain' })
      .png({ compressionLevel: 9 })
      .toFile(resolve(OUT_DIR, `${name}.png`));
    console.log(`  ✓ ${name}.png`);
  }

  // favicon.ico-friendly 32x32 PNG (بديل favicon.svg الحالي إن لزم)
  await sharp(svg)
    .resize(32, 32, { fit: 'contain' })
    .png()
    .toFile(resolve(OUT_DIR, 'favicon-32.png'));
  console.log('  ✓ favicon-32.png');

  console.log('\nPWA icons generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
