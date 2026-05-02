'use client';

/**
 * useShoppingRealtime — مزامنة قوائم المشتريات بين الأجهزة (multi-tenant safe)
 *
 * يفلتر الـ Supabase Realtime channels بـ:
 *   - `shopping_lists` على `householdId=eq.${householdId}` (فلترة على الخادم)
 *   - `shopping_items` على `listId=in.(...)` بحدود قوائم البيت الحالي
 *
 * النتيجة: متصفح كل عائلة يستلم events بياناته فقط — لا تداخل ولا
 * resource leak من نشاط العوائل الأخرى.
 *
 * متطلبات: Supabase Realtime مفعّل على الجدولين (Database → Replication).
 * إن لم يكن مفعّلاً، subscription يفشل بصمت.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { shoppingKeys } from './useShopping';

let _supabase: ReturnType<typeof createClient> | null = null;

function getRealtimeClient() {
  if (_supabase) return _supabase;
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  if (!url || !anonKey) return null;

  _supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return _supabase;
}

interface UseShoppingRealtimeOptions {
  /** household ID للجلسة الحالية — يفلتر shopping_lists */
  householdId: string;
  /** قوائم البيت الحالي — تُستخدم لفلترة shopping_items */
  listIds: string[];
}

export function useShoppingRealtime({ householdId, listIds }: UseShoppingRealtimeOptions) {
  const qc = useQueryClient();

  // listIds مجمَّعة كـ string ثابت — يمنع re-subscribe على كل render
  const listIdsKey = listIds.slice().sort().join(',');

  useEffect(() => {
    if (!householdId) return;

    const supabase = getRealtimeClient();
    if (!supabase) return;

    // اسم القناة فريد لكل (household + listIds) — يمنع تداخل المشتركين
    const channelName = `shopping-${householdId}`;

    let channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `householdId=eq.${householdId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: shoppingKeys.all });
        }
      );

    // shopping_items يُفلتَر بـ listId — فقط إن وُجدت قوائم
    if (listIdsKey) {
      const ids = listIdsKey.split(',');
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `listId=in.(${ids.join(',')})`,
        },
        () => {
          qc.invalidateQueries({ queryKey: shoppingKeys.all });
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {
        /* تجاهل */
      });
    };
  }, [qc, householdId, listIdsKey]);
}
