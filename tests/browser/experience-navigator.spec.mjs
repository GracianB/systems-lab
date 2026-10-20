import { test, expect } from '@playwright/test';

test('V2 explorer loads as a production asset and navigates directly to real projects', async ({ page }) => {
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',res=>{if(res.url().includes('experience-navigator')&&res.status()>=400)errors.push(res.url()+' '+res.status())});
  await page.goto('/?lang=es');
  const launcher=page.locator('.lab-command-launch');
  await expect(launcher).toBeVisible();
  await page.keyboard.press('Control+k');
  const overlay=page.locator('#lab-command-overlay');
  await expect(overlay).toBeVisible();
  await expect(launcher).toHaveAttribute('aria-expanded','true');
  await expect(page.getByRole('dialog',{name:'¿Qué quieres explorar?'})).toBeVisible();
  const search=page.getByRole('combobox',{name:'Buscar proyectos'});
  await expect(search).toBeFocused();
  await expect(page.getByRole('option')).toHaveCount(8);
  await search.fill('vortice');
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('option')).toContainText('VÓRTICE');
  await page.keyboard.press('Enter');
  await expect(overlay).toBeHidden();
  await expect(page).toHaveURL(/#vortex-live$/);
  await expect(page.locator('#vortex-live')).toBeFocused();
  expect(errors).toEqual([]);
});

test('V2 search works in both languages and restores focus on closing', async ({page})=>{
  await page.goto('/?lang=en');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog',{name:'Where do you want to go?'})).toBeVisible();
  const input=page.getByRole('combobox',{name:'Search projects'});
  await input.fill('analytics');
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('option')).toContainText('REVOPS STUDIO');
  await input.fill('zz-not-real-zz');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.locator('.lab-command-empty')).toHaveText('Nothing found. Try another word.');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lab-command-overlay')).toBeHidden();
  await expect(page.locator('.lab-command-launch')).toBeFocused();
  await page.locator('.lab-command-launch').click();
  await input.fill('local');
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('option')).toContainText('AIGORITMO');
  await page.locator('.lab-command-exit').click();
  await expect(page.locator('.lab-command-launch')).toBeFocused();
});

test('V2 keyboard selection is wrapped, accessible and links never point to local private apps', async({page})=>{
  await page.goto('/?lang=es');
  await page.locator('.lab-command-launch').click();
  const input=page.getByRole('combobox');
  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('option').last()).toHaveAttribute('aria-selected','true');
  await expect(input).toHaveAttribute('aria-activedescendant','lab-command-option-hub');
  const link=page.getByRole('option').last();
  await expect(link).toHaveAttribute('href','https://gracianb.github.io/GracianB/');
  await expect(link).toHaveAttribute('rel',/noopener/);
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected','true');
  await expect(page.locator('[role=option][href^="http"]')).toHaveCount(3);
  expect(await page.locator('[role=option]').evaluateAll(els=>els.every(el=>{const href=el.getAttribute('href')||'';return !href.includes('localhost')&&!href.includes('127.0.0.1')}))).toBe(true);
  await page.keyboard.press('Escape');
});

test('V2 modal fits narrow viewport and obeys reduced motion', async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:320,height:700});
  await page.goto('/');
  await page.locator('.lab-command-launch').click();
  const modal=page.locator('.lab-command-box');
  await expect(modal).toBeVisible();
  const metrics=await modal.evaluate(node=>{
    const rect=node.getBoundingClientRect();
    return {left:rect.left,right:rect.right,viewport:window.innerWidth,overflow:document.documentElement.scrollWidth};
  });
  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(321);
  expect(metrics.overflow).toBeLessThanOrEqual(321);
  await expect(page.locator('.lab-command-overlay')).toHaveCSS('backdrop-filter','none');
  await page.keyboard.press('Escape');
});
