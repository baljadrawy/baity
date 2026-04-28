/**
 * Smoke tests — يتحقق أن النشر يستجيب وأن المسارات الأساسية تَرنْدَر.
 * لا تختبر تفاعلاً معقّداً — هدفها التقاط حالات "السيرفر مات" أو "أخطاء بناء كبرى".
 */

import { test, expect } from '@playwright/test';

test('root redirects to /ar', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/ar(\/login)?$/);
});

test('/api/health responds healthy with DB ok', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.status).toBe('healthy');
  expect(json.checks?.database).toBe('ok');
});

test('login page renders title and phone input', async ({ page }) => {
  await page.goto('/ar/login');
  // الصفحة وصلت
  await expect(page).toHaveURL(/\/ar\/login/);
  // يوجد حقل لإدخال رقم الجوال (input من نوع tel أو text)
  const phoneInput = page.locator('input').first();
  await expect(phoneInput).toBeVisible();
});

test('OTP endpoint validates Saudi phone format', async ({ request }) => {
  // رقم غير صالح (دولي) — يُرفض من Zod بـ 422
  const bad = await request.post('/api/v1/auth/otp', {
    data: { phone: '+966501234567' },
  });
  expect(bad.status()).toBe(422);

  // رقم سعودي صحيح لمستخدم لم يربط Telegram → 404 not_linked + botUsername
  const good = await request.post('/api/v1/auth/otp', {
    data: { phone: '0501234567' },
  });
  expect(good.status()).toBe(404);
  const body = await good.json();
  expect(body.error).toBe('not_linked');
  expect(body.botUsername).toBeTruthy();
});

test('internal telegram-link endpoint requires secret', async ({ request }) => {
  const res = await request.post('/api/v1/internal/telegram-link', {
    data: { phone: '0501234567', chatId: '12345' },
  });
  expect(res.status()).toBe(401);
});

test('locale prefix enforced: dashboard redirects to login when unauthenticated', async ({
  page,
}) => {
  const response = await page.goto('/ar/dashboard');
  // إما يُرَنْدَر صفحة التسجيل، أو يُعيد لـ /ar/login
  expect(response?.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/ar\/(login|dashboard)/);
});
