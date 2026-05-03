import { expect, test } from '@playwright/test';

test('login page exposes accessible form controls', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Acesso operacional' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});
