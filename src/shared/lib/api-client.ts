/**
 * API Client — Typed Fetch Wrapper
 *
 * مركزية كل استدعاءات الـ API مع:
 * - Type safety كاملة
 * - Error handling موحّد
 * - Retry logic للشبكة
 * - CSRF-safe (httpOnly cookies تُرسَل تلقائياً)
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'خطأ في الاتصال بالشبكة') {
    super(message);
    this.name = 'NetworkError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** عدد مرات إعادة المحاولة عند فشل الشبكة (default: 1) */
  retries?: number;
}

const BASE_URL = '/api/v1';

/**
 * دالة fetch المركزية — تُضيف headers الافتراضية وتُعالج الأخطاء
 */
async function request<T>(
  path: string,
  { body, retries = 1, ...init }: RequestOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };

  const fetchOptions: RequestInit = {
    ...init,
    headers,
    credentials: 'include', // يُرسِل httpOnly cookies تلقائياً
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };

  let lastError: Error = new NetworkError();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        let errorData: unknown;
        try {
          errorData = await res.json();
        } catch {
          errorData = { message: res.statusText };
        }

        const message =
          typeof errorData === 'object' &&
          errorData !== null &&
          'message' in errorData
            ? String((errorData as Record<string, unknown>).message)
            : `HTTP Error ${res.status}`;

        throw new ApiError(res.status, message, errorData);
      }

      // 204 No Content
      if (res.status === 204) return undefined as T;

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err; // لا نُعيد المحاولة على أخطاء HTTP

      // أخطاء الشبكة — نُعيد المحاولة
      lastError = err instanceof Error ? err : new NetworkError();
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// ============================================================
// HTTP Methods
// ============================================================

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

// ============================================================
// Error Helpers
// ============================================================

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isUnauthorized(err: unknown): boolean {
  return isApiError(err) && err.status === 401;
}

export function isNotFound(err: unknown): boolean {
  return isApiError(err) && err.status === 404;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'حدث خطأ غير متوقع';
}
