/**
 * تحقق من متغيرات البيئة وتصديرها مع type safety
 *
 * القاعدة: لا تستخدم process.env مباشرة في الكود — استورد من هنا.
 * هذا يضمن:
 * 1. Type safety كاملة
 * 2. اكتشاف القيم المفقودة عند الإطلاق لا في runtime
 * 3. توثيق واضح لكل variable مستخدمة
 */

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `❌ متغير البيئة "${key}" مفقود. راجع .env.local.example للحصول على القيمة الصحيحة.`
    );
  }
  return val;
}

function optionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] ?? defaultValue;
}

// ---- تحذير: هذا الملف يُشغَّل على الـ server فقط ----
// لا تستورد منه في Client Components

export const serverEnv = {
  // قاعدة البيانات
  databaseUrl: requireEnv('DATABASE_URL'),

  // JWT
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),

  // Supabase
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // Redis
  redisUrl: optionalEnv('REDIS_URL', 'redis://localhost:6379'),

  // Telegram
  telegramBotToken: optionalEnv('TELEGRAM_BOT_TOKEN'),

  // Storage
  storageMaxFileSizeMb: parseInt(optionalEnv('STORAGE_MAX_FILE_SIZE_MB', '20'), 10),

  // App
  nodeEnv: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  appUrl: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
};

// ---- متغيرات Public (تُستخدم في Client أيضاً) ----
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'بيتي',
};
