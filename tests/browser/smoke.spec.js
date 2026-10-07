import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`navigation, themes, language and demo at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['warning', 'error'].includes(m.type())) errors.push(m.text()); });
    page.on('response', r => { if (r.url().startsWith('http://127.0.0.1') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Ideas que');
    await page.locator('[data-set-lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Ideas that');
    await page.locator('[data-set-theme="light"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    if (width < 900) {
      const toggle = page.locator('[data-menu-toggle]');
      await toggle.click();
      await expect(page.locator('#drawer')).toBeVisible();
      await page.locator('#drawer a').last().focus();
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-drawer-close]')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator('#drawer a').last()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(toggle).toBeFocused();
      await expect(page.locator('#drawer')).toBeHidden();
    }
    await page.locator('#agente').scrollIntoViewIfNeeded();
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('#disclaimer')).toContainText('fictional');
    await frame.locator('[data-intent="shipping"]').click();
    await expect(frame.locator('#messages')).toContainText('DEMO-4821');
    await expect(frame.locator('html')).toHaveAttribute('data-theme', 'light');
    await frame.locator('#reset').click();
    await expect(frame.locator('.message')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-set-lang="es"]').click();
    await page.locator('[data-set-theme="dark"]').click();
    await expect(frame.locator('#disclaimer')).toContainText('ficticios');
    await expect(frame.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });
}

test('optional APIs and storage cannot break startup', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    Object.defineProperty(window, 'matchMedia', { value: undefined });
    Object.defineProperty(window, 'requestAnimationFrame', { value: undefined });
    HTMLCanvasElement.prototype.getContext = () => { throw new Error('canvas unavailable'); };
    document.startViewTransition = function () { throw new Error('transition unavailable'); };
  });
  await page.goto('/');
  await page.locator('[data-set-theme="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('[data-set-lang="en"]').click();
  await expect(page.locator('h1')).toContainText('Ideas that');
  expect(errors).toEqual([]);
});

test('Document receiver and rejected transition promises', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    document.startViewTransition = function (callback) {
      if (this !== document) throw new TypeError('Illegal Document receiver');
      window.transitionCalls = (window.transitionCalls || 0) + 1; callback();
      return { finished: Promise.reject(new Error('skipped')), updateCallbackDone: Promise.resolve() };
    };
  });
  await page.goto('/');
  await page.locator('[data-set-theme="light"]').click();
  await expect.poll(() => page.evaluate(() => window.transitionCalls)).toBe(1);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

test('reduced motion and keyboard access', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.keyboard.press('Tab'); await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/#main$/);
  expect(await page.locator('.fx').evaluate(el => getComputedStyle(el).display)).toBe('none');
});

test('WCAG AA checks in both themes', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.goto('/');
  for (const theme of ['dark', 'light']) {
    await page.locator(`[data-set-theme="${theme}"]`).click();
    await page.locator('#agente').scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id:v.id, nodes:v.nodes.map(n => n.target) }))).toEqual([]);
  }
});
