import { expect, test } from '@playwright/test';

const EXPECTED_COLORS = ['yellow', 'coral', 'cyan', 'mint', 'purple'];

test('opens 5 tabs with 5 distinct Jugnu favicon colors and renders new Jugnu logo', async ({ context, request }) => {
  for (const color of EXPECTED_COLORS) {
    const res32 = await request.get(`/Favicon/favicon/${color}/32.svg`);
    expect(res32.ok()).toBe(true);
    expect(await res32.text()).toContain('<svg');
  }

  const pages = [];
  for (let i = 0; i < 5; i++) {
    const p = await context.newPage();
    await p.goto('/');
    pages.push(p);
  }

  // Allow BroadcastChannel conflict resolution to settle if tabs loaded concurrently.
  await pages[4].waitForTimeout(150);

  const colors = await Promise.all(
    pages.map((p) =>
      p.evaluate(() => ({
        datasetColor: document.documentElement.dataset.faviconColor ?? null,
        href32: document.querySelector<HTMLLinkElement>('link[rel="icon"][sizes="32x32"]')?.getAttribute('href') ?? null,
        href16: document.querySelector<HTMLLinkElement>('link[rel="icon"][sizes="16x16"]')?.getAttribute('href') ?? null,
        logoLoaded: (() => {
          const img = document.querySelector<HTMLImageElement>('.site-logo');
          return Boolean(img && img.getAttribute('src')?.includes('Jugnu Logo V1.svg') && img.complete && img.naturalWidth > 0);
        })(),
      })),
    ),
  );

  expect(colors[0].datasetColor).toBe('yellow');
  expect(new Set(colors.map((c) => c.datasetColor)).size).toBe(5);
  for (const entry of colors) {
    expect(EXPECTED_COLORS).toContain(entry.datasetColor);
    expect(entry.href32).toBe(`/Favicon/favicon/${entry.datasetColor}/32.svg`);
    expect(entry.href16).toBe(`/Favicon/favicon/${entry.datasetColor}/16-1.svg`);
    expect(entry.logoLoaded).toBe(true);
  }

  // Closing the second tab (coral) should free coral for a newly opened tab.
  const closedColor = colors[1].datasetColor;
  await pages[1].close();

  const replacement = await context.newPage();
  await replacement.goto('/');
  await replacement.waitForTimeout(150);
  const replacementColor = await replacement.evaluate(() => document.documentElement.dataset.faviconColor);
  expect(replacementColor).toBe(closedColor);
});

