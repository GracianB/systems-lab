import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function strictConsole(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push("pageerror: " + error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      failures.push(message.type() + ": " + message.text());
    }
  });
  return () => expect(failures, failures.join("\n")).toEqual([]);
}

test("boots cleanly and exposes the complete portfolio surface", async ({ page }) => {
  const assertClean = strictConsole(page);
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("main#main")).toBeVisible();
  await expect(page.locator("h1")).toContainText(/Ideas|funcionan/i);
  await expect(page.locator(".feat")).toHaveCount(2);
  await expect(page.locator(".agent-stage iframe")).toBeVisible();
  assertClean();
});

test("theme and language survive interaction without runtime errors", async ({ page }) => {
  const assertClean = strictConsole(page);
  await page.goto("/");
  await page.locator('[data-set-theme="light"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator('[data-set-lang="en"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-lang", "en");
  await expect(page.locator("h1")).not.toContainText("Ideas que");
  assertClean();
});

test("mobile drawer is keyboard-safe and returns focus", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile contract");
  const assertClean = strictConsole(page);
  await page.goto("/");
  const menu = page.locator("[data-menu-toggle]");
  await menu.focus();
  await menu.click();
  await expect(page.locator("#drawer")).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#drawer")).toBeHidden();
  await expect(menu).toBeFocused();
  assertClean();
});

test("reduced motion disables decorative motion and startup remains clean", async ({ page }) => {
  const assertClean = strictConsole(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", /dark|light/);
  const fxDisplay = await page.locator(".fx").evaluate((el) => getComputedStyle(el).display);
  expect(fxDisplay).toBe("none");
  assertClean();
});

test("has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(severe, severe.map((v) => v.id + ": " + v.help).join("\n")).toEqual([]);
});
