/**
 * Service Worker — بيتي PWA
 *
 * استراتيجية التخزين المؤقت:
 * - Shell (HTML/JS/CSS): Cache First → شبكة إذا قديمة
 * - API: Network First → cache إذا offline
 * - الصور: Cache First مع حد زمني
 *
 * يُسجَّل من src/app/[locale]/layout.tsx
 */

const CACHE_NAME = 'baity-v2';
const OFFLINE_URL = '/offline.html';

// الملفات الأساسية التي تُحمَّل مسبقاً
const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
];

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // لا نُفشل التثبيت إذا فشل بعض الملفات
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    })
  );
  // تفعيل فوري بدون انتظار إغلاق التبويبات القديمة
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // تولّي التحكم بكل الصفحات المفتوحة فوراً
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل: Chrome extensions, non-GET, POST إلى API
  if (
    !request.url.startsWith(self.location.origin) ||
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // الصور: Cache First
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // JS/CSS الـ static: Cache First (Next.js يضع hash في الاسم)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // الصفحات وباقي الطلبات: Network First مع fallback للـ offline
  event.respondWith(networkFirstWithOfflineFallback(request));
});

// ─── Strategies ─────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Network error' });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback لصفحة offline إذا كان الطلب لصفحة HTML
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_URL);
      if (offlinePage) return offlinePage;
    }

    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ─── Push Notifications ─────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'بيتي', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'بيتي', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag ?? 'baity-notification',
      data: { url: data.url ?? '/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === targetUrl && 'focus' in c);
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
