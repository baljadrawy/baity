/**
 * QueryProvider — TanStack Query Client Setup
 *
 * يُغلّف التطبيق بـ QueryClientProvider مع إعدادات مناسبة للمشروع.
 * يجب وضعه في layout.tsx الجذر فوق كل شيء.
 */

'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { isUnauthorized } from '@/shared/lib/api-client';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // إنشاء client مرة واحدة لكل جلسة (وليس في كل render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // البيانات تعتبر stale بعد دقيقة
            staleTime: 60_000,
            // تُخزَّن في الـ cache لمدة 5 دقائق بعد آخر استخدام
            gcTime: 5 * 60_000,
            // إعادة المحاولة مرة واحدة فقط عند الفشل
            retry: (failureCount, error) => {
              // لا نُعيد المحاولة عند 401 (غير مصادَق)
              if (isUnauthorized(error)) return false;
              return failureCount < 1;
            },
            // إعادة الجلب عند العودة للتبويب
            refetchOnWindowFocus: true,
          },
          mutations: {
            // لا نُعيد المحاولة للـ mutations تلقائياً
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools تظهر فقط في بيئة التطوير */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
