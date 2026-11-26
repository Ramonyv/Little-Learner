import { expect, test } from '@playwright/test';

test('SEO/AEO canonicals, JSON-LD, and crawler endpoints work across routes', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Jugnu/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jugnu.fun/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://www.jugnu.fun/og-image.png');
  const homeLd = await page.locator('script[data-seo-jsonld="true"]').allTextContents();
  expect(homeLd.some(text => text.includes('"@type":"WebSite"') && text.includes('https://www.jugnu.fun'))).toBe(true);

  await page.goto('/information/faq');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jugnu.fun/information/faq');
  const faqLd = await page.locator('script[data-seo-jsonld="true"]').allTextContents();
  expect(faqLd.some(text => text.includes('"@type":"FAQPage"'))).toBe(true);

  await page.goto('/progress');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');

  for (const path of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain('https://www.jugnu.fun');
  }
});

