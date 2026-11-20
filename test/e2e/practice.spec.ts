import { expect, test } from '@playwright/test';

test('practice answers appear in results and review', async ({ page }) => {
  await page.goto('/intro/english/spelling');
  await expect(page.getByRole('heading', { name: 'Spelling' })).toBeVisible();
  await page.getByRole('switch').click();
  await page.getByRole('button', { name: 'Start Practice' }).click();

  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  await page.getByRole('button', { name: /^Option A:/ }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByRole('button', { name: 'Finish Test' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('answered 1 of');
  await page.getByRole('button', { name: 'Submit & View Results' }).click();

  await expect(page.getByRole('button', { name: 'Review Answers' })).toBeVisible();
  await page.getByRole('button', { name: 'Review Answers' }).click();
  await expect(page.getByText('Your answer: A')).toBeVisible();
  await expect(page.getByText('Explanation', { exact: true })).toBeVisible();
});
