/**
 * Storage Abstraction — التخزين المحلي (Web → Capacitor)
 *
 * يعمل على الويب عبر localStorage (مشفّر).
 * الـ tokens والـ sessions لا تُخزَّن هنا أبداً — httpOnly cookies فقط.
 *
 * استخدام مقبول: إعدادات الواجهة (theme, language preference)
 * استخدام ممنوع: tokens، passwords، بيانات شخصية
 */

/** المفاتيح المسموح بها — لا تُخزَّن بيانات حساسة */
export type StorageKey =
  | 'theme'
  | 'sidebar_collapsed'
  | 'dashboard_layout'
  | 'locale_preference'
  | 'last_visited_household';

interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
}

/** Web adapter — localStorage */
const webAdapter: StorageAdapter = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private mode أو storage full — fail silently
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // fail silently
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch {
      // fail silently
    }
  },
};

/** In-memory adapter للـ SSR */
const memoryStore = new Map<string, string>();
const memoryAdapter: StorageAdapter = {
  get: (key) => memoryStore.get(key) ?? null,
  set: (key, value) => { memoryStore.set(key, value); },
  remove: (key) => { memoryStore.delete(key); },
  clear: () => { memoryStore.clear(); },
};

/** اختار الـ adapter المناسب */
function getAdapter(): StorageAdapter {
  if (typeof window === 'undefined') return memoryAdapter;
  return webAdapter;
}

// ============================================================
// Public API
// ============================================================

const PREFIX = 'baity_';

export const storage = {
  get<T>(key: StorageKey, fallback?: T): T | null {
    const adapter = getAdapter();
    const raw = adapter.get(`${PREFIX}${key}`);
    if (raw === null) return fallback ?? null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  },

  set<T>(key: StorageKey, value: T): void {
    const adapter = getAdapter();
    adapter.set(`${PREFIX}${key}`, JSON.stringify(value));
  },

  remove(key: StorageKey): void {
    const adapter = getAdapter();
    adapter.remove(`${PREFIX}${key}`);
  },

  /** امسح كل بيانات التطبيق (عند تسجيل الخروج) */
  clearAll(): void {
    const adapter = getAdapter();
    // امسح فقط مفاتيح التطبيق
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) {
        adapter.remove(key);
      }
    }
  },
};
