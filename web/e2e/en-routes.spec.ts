import { test, expect } from '@playwright/test';

/**
 * English surface golden paths.
 *
 * Covers the i18n+SEO routes added in the round-2 expansion:
 *   - /en/tools          interactive catalog (search + category filter)
 *   - /en/tools/{slug}   transactional landing
 *   - /en/guide/{slug}   how-to guide
 *   - /en/compare        comparison hub + a comparison page
 *
 * These run against the dev server (see playwright.config.ts). They assert
 * structure and cross-links, not exact marketing copy, so small wording
 * changes won't break them.
 */

test.describe('English catalog (/en/tools)', () => {
  test('renders the catalog with EN badges and tool count', async ({ page }) => {
    await page.goto('/en/tools');
    await expect(page.getByRole('heading', { name: 'All Tools', exact: true })).toBeVisible();
    // curated tools show an EN badge
    await expect(page.getByText('EN', { exact: true }).first()).toBeVisible();
  });

  test('search filters the grid', async ({ page }) => {
    await page.goto('/en/tools');
    const search = page.getByPlaceholder(/Search tools/i);
    await search.fill('qr');
    // QR tool's English name should appear
    await expect(page.getByText(/QR Code Generator/i).first()).toBeVisible();
    // an unrelated tool should not
    await expect(page.getByText(/Lorem Ipsum/i)).toHaveCount(0);
  });

  test('category filter narrows results', async ({ page }) => {
    await page.goto('/en/tools');
    await page.getByRole('button', { name: 'PDF', exact: true }).click();
    await expect(page.getByText(/Merge PDF/i).first()).toBeVisible();
  });
});

test.describe('English tool page (/en/tools/{slug})', () => {
  test('qr-code landing links to the working tool and its guide', async ({ page }) => {
    await page.goto('/en/tools/qr-code');
    await expect(
      page.getByRole('heading', { name: /QR Code Generator/i }).first(),
    ).toBeVisible();
    // CTA to the actual in-browser tool
    await expect(page.getByRole('link', { name: /Open the tool/i }).first()).toHaveAttribute(
      'href',
      '/tools/util/qr',
    );
    // link to the how-to guide
    await expect(page.getByRole('link', { name: /How-to guide/i })).toHaveAttribute(
      'href',
      '/en/guide/qr-code',
    );
  });

  test('image-convert landing surfaces related comparisons', async ({ page }) => {
    await page.goto('/en/tools/image-convert');
    // png-vs-jpg references image-convert, so it should be cross-linked
    await expect(page.getByRole('link', { name: /PNG vs JPG/i })).toBeVisible();
  });
});

test.describe('English guide page (/en/guide/{slug})', () => {
  test('renders steps and FAQ', async ({ page }) => {
    await page.goto('/en/guide/pdf-merge');
    await expect(page.getByRole('heading', { name: /How to use Merge PDF/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Step-by-step' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Frequently asked' })).toBeVisible();
    // CTA opens the real tool
    await expect(page.getByRole('link', { name: /Open the tool/i }).first()).toHaveAttribute(
      'href',
      '/tools/pdf/merge',
    );
  });
});

test.describe('English comparisons (/en/compare)', () => {
  test('compare hub lists comparison cards', async ({ page }) => {
    await page.goto('/en/compare');
    await expect(page.getByRole('heading', { name: 'Tool Comparisons' })).toBeVisible();
    await expect(page.getByRole('link', { name: /PNG vs JPG/i })).toBeVisible();
  });

  test('a comparison page shows both options and a verdict', async ({ page }) => {
    await page.goto('/en/compare/png-vs-jpg');
    await expect(
      page.getByRole('heading', { name: 'PNG vs JPG', exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Which should you use/i })).toBeVisible();
    // both options link to a tool
    await expect(page.getByRole('link', { name: /Open PNG/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open JPG/i })).toBeVisible();
  });
});
