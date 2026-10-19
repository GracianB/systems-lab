import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`navigation, themes, language and demo at ${width}px`, async ({ page, isMobile }) => {
    test.skip(isMobile && width > 390, "Large desktop widths are covered by desktop browser projects");
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {
      const text = m.text();
      // Firefox's lazy-frame renderer emits this internal line-0 diagnostic;
      // application warnings and all console/runtime errors remain failures.
      const frameNotice = m.type() === 'warning' && text.includes('JavaScript Warning:') && text.includes('Layout was forced before the page was fully loaded.') && text.includes('line: 0');
      if (['warning', 'error'].includes(m.type()) && !frameNotice) errors.push(text);
    });
    page.on('response', r => { if (r.url().startsWith('http://127.0.0.1') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Las ideas,');
    await expect(page.locator('.cover-links .cover-node')).toHaveCount(4);
    await expect(page.locator('.hero-rail')).toHaveCount(0);
    await expect(page.locator('.lab-more-card')).toHaveCount(2);
    await expect(page.locator('[data-i18n="revopsStatus"]')).toHaveText('DEMO PÚBLICA');
    await page.locator('[data-set-lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Ideas,');
    await expect(page.locator('[data-i18n="revopsStatus"]')).toHaveText('PUBLIC DEMO');
    await expect(page.locator('.lab-more-card').last()).toContainText('Private local clip editor');
    await expect(page.locator('.lab-more-card').last().locator('a')).toHaveCount(0);
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
    await page.locator('#agente summary').click();
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('#disclaimer')).toContainText('fictional');
    await frame.locator('[data-intent="shipping"]').click();
    await expect(frame.locator('#messages')).toContainText('DEMO-4821');
    await page.locator('[data-set-theme="dark"]').click();
    await expect(frame.locator('#messages')).toContainText('DEMO-4821');
    await page.locator('[data-set-theme="light"]').click();
    await expect(frame.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('.agent-stage').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
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
  await expect(page.locator('h1')).toContainText('Ideas,');
  expect(errors).toEqual([]);
});

test('Document receiver and rejected transition promises', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await expect(page.locator('#lab-field')).toHaveAttribute('data-motion', 'static');
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
