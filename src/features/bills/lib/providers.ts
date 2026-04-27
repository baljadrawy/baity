/**
 * مزودو الخدمة السعوديون — قائمة محددة مسبقاً
 *
 * تُستخدَم في نموذج إضافة الفاتورة لتسريع الإدخال.
 * البيانات: اسم عربي + إنجليزي + تصنيف + لون
 */

import type { ServiceProvider } from '../types';

export const SERVICE_PROVIDERS: ServiceProvider[] = [
  // ===== الكهرباء =====
  {
    id: 'sec',
    nameAr: 'شركة الكهرباء',
    nameEn: 'SEC',
    category: 'ELECTRICITY',
    color: '#F59E0B', // أصفر
  },

  // ===== المياه =====
  {
    id: 'nwc',
    nameAr: 'المياه الوطنية',
    nameEn: 'NWC',
    category: 'WATER',
    color: '#3B82F6', // أزرق
  },

  // ===== الاتصالات =====
  {
    id: 'stc',
    nameAr: 'STC',
    nameEn: 'STC',
    category: 'TELECOM',
    color: '#8B5CF6', // بنفسجي
  },
  {
    id: 'mobily',
    nameAr: 'موبايلي',
    nameEn: 'Mobily',
    category: 'TELECOM',
    color: '#10B981', // أخضر
  },
  {
    id: 'zain',
    nameAr: 'زين',
    nameEn: 'Zain',
    category: 'TELECOM',
    color: '#EF4444', // أحمر
  },
  {
    id: 'virgin',
    nameAr: 'فيرجن موبايل',
    nameEn: 'Virgin Mobile',
    category: 'TELECOM',
    color: '#EC4899', // وردي
  },

  // ===== الإنترنت =====
  {
    id: 'stc_internet',
    nameAr: 'STC الإنترنت',
    nameEn: 'STC Internet',
    category: 'INTERNET',
    color: '#8B5CF6',
  },
  {
    id: 'mobily_internet',
    nameAr: 'موبايلي الإنترنت',
    nameEn: 'Mobily Internet',
    category: 'INTERNET',
    color: '#10B981',
  },
  {
    id: 'zain_internet',
    nameAr: 'زين الإنترنت',
    nameEn: 'Zain Internet',
    category: 'INTERNET',
    color: '#EF4444',
  },

  // ===== الاشتراكات =====
  {
    id: 'netflix',
    nameAr: 'نتفليكس',
    nameEn: 'Netflix',
    category: 'SUBSCRIPTION',
    color: '#EF4444',
  },
  {
    id: 'shahid',
    nameAr: 'شاهد',
    nameEn: 'Shahid',
    category: 'SUBSCRIPTION',
    color: '#F59E0B',
  },
  {
    id: 'spotify',
    nameAr: 'سبوتيفاي',
    nameEn: 'Spotify',
    category: 'SUBSCRIPTION',
    color: '#22C55E',
  },
  {
    id: 'apple_one',
    nameAr: 'آبل وان',
    nameEn: 'Apple One',
    category: 'SUBSCRIPTION',
    color: '#6B7280',
  },
  {
    id: 'stc_play',
    nameAr: 'STC Play',
    nameEn: 'STC Play',
    category: 'SUBSCRIPTION',
    color: '#8B5CF6',
  },
  {
    id: 'amazon_prime',
    nameAr: 'أمازون برايم',
    nameEn: 'Amazon Prime',
    category: 'SUBSCRIPTION',
    color: '#F97316',
  },
  {
    id: 'beoutq',
    nameAr: 'beIN Sports',
    nameEn: 'beIN Sports',
    category: 'SUBSCRIPTION',
    color: '#7C3AED',
  },

  // ===== التأمين =====
  {
    id: 'tawuniya',
    nameAr: 'التعاونية',
    nameEn: 'Tawuniya',
    category: 'INSURANCE',
    color: '#0EA5E9',
  },
  {
    id: 'bupa',
    nameAr: 'بوبا العربية',
    nameEn: 'Bupa Arabia',
    category: 'INSURANCE',
    color: '#1D4ED8',
  },
  {
    id: 'malath',
    nameAr: 'ملاذ',
    nameEn: 'Malath',
    category: 'INSURANCE',
    color: '#065F46',
  },
];

/** جلب مزود بـ ID */
export function getProvider(id: string): ServiceProvider | undefined {
  return SERVICE_PROVIDERS.find((p) => p.id === id);
}

/** فلترة حسب التصنيف */
export function getProvidersByCategory(category: string): ServiceProvider[] {
  return SERVICE_PROVIDERS.filter((p) => p.category === category);
}

/** لون التصنيف الافتراضي */
export const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICITY: '#F59E0B',
  WATER: '#3B82F6',
  TELECOM: '#8B5CF6',
  INTERNET: '#06B6D4',
  SUBSCRIPTION: '#EF4444',
  RENT: '#84CC16',
  INSURANCE: '#0EA5E9',
  OTHER: '#6B7280',
};

/** أيقونة Lucide لكل تصنيف */
export const CATEGORY_ICONS: Record<string, string> = {
  ELECTRICITY: 'Zap',
  WATER: 'Droplets',
  TELECOM: 'Phone',
  INTERNET: 'Wifi',
  SUBSCRIPTION: 'Play',
  RENT: 'Home',
  INSURANCE: 'Shield',
  OTHER: 'Receipt',
};
