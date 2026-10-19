import { test, expect } from "@playwright/test";

test("P36 nested unknown routes return self-contained 404 with safe recovery", async ({ page }) => {
  const externalRequests = [];
  page.on("request", req => {
    if (!req.url().startsWith("http://127.0.0.1:")) externalRequests.push(req.url());
  });
  const response = await page.goto("/unknown/nested/route?lang=en");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("404 · Systems Lab");
  await expect(page.locator("h1")).toHaveText("Esta ruta no existe.");
  await expect(page.locator('p[lang="en"]')).toBeVisible();
  await expect(page.locator(".actions .primary")).toHaveAttribute("href", "https://gracianb.github.io/systems-lab/");
  await expect(page.locator("main")).toBeVisible();
  expect(externalRequests).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  expect(overflow).toBe(false);
});

test("P36 404 respects OS light and dark preferences without loading fonts", async ({ page }) => {
  await page.emulateMedia({ colorScheme:"light" });
  await page.goto("/missing/deep/file.html");
  await expect(page.locator("body")).toHaveCSS("background-color","rgb(245, 247, 250)");
  await page.emulateMedia({ colorScheme:"dark" });
  await expect(page.locator("body")).toHaveCSS("background-color","rgb(6, 8, 13)");
  const AxeBuilder = (await import("@axe-core/playwright")).default;
  const audit = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(audit.violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
});
