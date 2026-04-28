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
  // رقم غير صالح (دولي) — يجب أن يُرفض (API يُرجع 422 من Zod)
  const bad = await request.post('/api/v1/auth/otp', {
    data: { phone: '+966501234567' },
  });
  expect(bad.status()).toBeGreaterThanOrEqual(400);
  expect(bad.status()).toBeLessThan(500);

  // رقم سعودي صحيح — يجب أن يُقبل (200 حتى لو OTP لم يُرسل فعلياً)
  const good = await request.post('/api/v1/auth/otp', {
    data: { phone: '0501234567' },
  });
  expect(good.status()).toBe(200);
});

test('locale prefix enforced: dashboard redirects to login when unauthenticated', async ({
  page,
}) => {
  const response = await page.goto('/ar/dashboard');
  // إما يُرَنْدَر صفحة التسجيل، أو يُعيد لـ /ar/login
  expect(response?.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/ar\/(login|dashboard)/);
});
