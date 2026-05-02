/**
 * usePushNotifications — Hook لإدارة Web Push من المتصفح
 *
 * يدير:
 * - فحص دعم المتصفح + حالة الإذن
 * - جلب VAPID public key من الخادم
 * - subscribe: طلب الإذن → Push API → إرسال للخادم
 * - unsubscribe: إلغاء + إخبار الخادم
 *
 * نظيف الفشل: إن لم تُعَدّ VAPID على الخادم، الزر يظهر "غير متاح" بدل crash.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/shared/lib/api-client';

export type PushStatus =
  | 'unsupported' // المتصفح لا يدعم
  | 'unconfigured' // الخادم لم يعدّ VAPID
  | 'denied' // المستخدم رفض
  | 'subscribed'
  | 'unsubscribed'
  | 'loading';

interface PushState {
  status: PushStatus;
  endpoint: string | null;
}

/** Convert URL-safe base64 → Uint8Array for applicationServerKey */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/push/public-key', { credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    return data.publicKey ?? null;
  } catch {
    return null;
  }
}

async function postSubscription(
  sub: PushSubscription
): Promise<void> {
  const json = sub.toJSON();
  const res = await fetch('/api/v1/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });
  if (!res.ok) throw new ApiError(res.status, 'subscribe_failed');
}

async function deleteSubscription(endpoint: string): Promise<void> {
  await fetch('/api/v1/push/subscribe', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    status: 'loading',
    endpoint: null,
  });

  /** فحص الحالة الأولية */
  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        if (!cancelled) setState({ status: 'unsupported', endpoint: null });
        return;
      }

      // إن لم يُعَدّ VAPID على الخادم → unconfigured
      const publicKey = await fetchVapidPublicKey();
      if (!publicKey) {
        if (!cancelled) setState({ status: 'unconfigured', endpoint: null });
        return;
      }

      if (Notification.permission === 'denied') {
        if (!cancelled) setState({ status: 'denied', endpoint: null });
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!cancelled) {
          setState({
            status: existing ? 'subscribed' : 'unsubscribed',
            endpoint: existing?.endpoint ?? null,
          });
        }
      } catch {
        if (!cancelled) setState({ status: 'unsubscribed', endpoint: null });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setState({ status: 'denied', endpoint: null });
      return;
    }

    const publicKey = await fetchVapidPublicKey();
    if (!publicKey) {
      setState({ status: 'unconfigured', endpoint: null });
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    // إنشاء ArrayBuffer من القيمة (TypeScript strict mode)
    const keyBytes = urlBase64ToUint8Array(publicKey);
    const keyBuffer = keyBytes.buffer.slice(
      keyBytes.byteOffset,
      keyBytes.byteOffset + keyBytes.byteLength
    ) as ArrayBuffer;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBuffer,
    });

    try {
      await postSubscription(sub);
      setState({ status: 'subscribed', endpoint: sub.endpoint });
    } catch (err) {
      console.error('subscribe to server failed', err);
      // تراجع: الغ الاشتراك لو فشل الإرسال للخادم
      await sub.unsubscribe().catch(() => {});
      setState({ status: 'unsubscribed', endpoint: null });
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await deleteSubscription(sub.endpoint).catch(() => {});
      }
      setState({ status: 'unsubscribed', endpoint: null });
    } catch (err) {
      console.error('unsubscribe failed', err);
    }
  }, []);

  return {
    status: state.status,
    endpoint: state.endpoint,
    subscribe,
    unsubscribe,
  };
}
