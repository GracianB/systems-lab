import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function strictConsole(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push("pageerror: " + error.message));
  page.on("console", (message) => {
    const text = message.text();
    const benignFirefoxLayoutNotice = message.type() === "warning"
      && text.includes("JavaScript Warning:")
      && text.includes("Layout was forced before the page was fully loaded.")
      && text.includes("line: 0");
    if ((message.type() === "error" || message.type() === "warning") && !benignFirefoxLayoutNotice) {
      failures.push(message.type() + ": " + text);
    }
  });
  return () => expect(failures, failures.join("\n")).toEqual([]);
}

test("Aigoritmo shows four peers, translated scope and no public localhost launch", async ({ page }) => {
  const assertClean = strictConsole(page);
  await page.goto("/?lang=es#aigoritmo");
  const showcase = page.locator("#aigoritmo");
  await showcase.scrollIntoViewIfNeeded();
  await expect(showcase.locator(".ai-persona")).toHaveCount(4);
  await expect(showcase.locator("h3")).toContainText(["Llama", "Qwen", "Arcana", "Arcano", "La experiencia vive en tu máquina."]);
  await expect(showcase.locator(".ai-launch a")).toHaveCount(0);
  await expect(showcase).toContainText("llama3.2:3b");
  await expect(showcase).toContainText("qwen2.5-coder:3b");
  for (const image of await showcase.locator("img").all()) {
    await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  await page.locator('[data-set-lang="en"]').click();
  await expect(showcase.locator("h2")).toHaveText("Four presences. A space of your own.");
  await expect(showcase).toContainText("LOCAL APP / PRIVATE SOURCE");
  await expect(showcase.locator(".ai-launch p")).toContainText("not hosted on this website");
  await page.locator('[data-set-theme="light"]').click();
  await showcase.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  assertClean();
});

test("boots cleanly and exposes the complete portfolio surface", async ({ page }) => {
  const assertClean = strictConsole(page);
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("main#main")).toBeVisible();
  await expect(page.locator("h1")).toContainText(/Las ideas|en acción/i);
  await expect(page.locator(".feat")).toHaveCount(1);
  await expect(page.locator(".agent-stage iframe")).not.toBeVisible();
  await page.locator("#agente summary").click();
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
  await expect(page.locator("h1")).toContainText("Ideas,");
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
  const motion = await page.locator("#lab-field").getAttribute("data-motion");
  expect(motion).toBe("static");
  assertClean();
});

test("has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(severe, severe.map((v) => v.id + ": " + v.help).join("\n")).toEqual([]);
});

test("project previews load and Vortex starts only on demand, then releases its frame", async ({ page }) => {
  await page.route("https://vortex-gilt-xi.vercel.app/", route => route.fulfill({ contentType: "text/html", body: "<h1>Vortex test field</h1>" }));
  await page.goto("/?lang=es#juegos");
  for (const image of await page.locator(".project-poster img").all()) {
    await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  await expect(page.locator("#vortex-window iframe")).toHaveCount(0);
  await page.locator("[data-vortex-start]").click();
  await expect(page.locator("#vortex-window iframe")).toHaveAttribute("src", "https://vortex-gilt-xi.vercel.app/");
  await expect(page.frameLocator("#vortex-window iframe").getByRole("heading")).toHaveText("Vortex test field");
  await page.locator('[data-set-lang="en"]').click();
  await expect(page.locator("[data-vortex-stop]")).toHaveText("Stop demo");
  await page.locator("[data-vortex-stop]").click();
  await expect(page.locator("#vortex-window iframe")).toHaveCount(0);
  await expect(page.locator("[data-vortex-start]")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("P30 explorer links lead directly to real sections, and mobile animation stays static", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?lang=es&theme=dark");
  const links = page.locator(".cover-links .cover-node");
  await expect(links).toHaveCount(4);
  for (const hash of ["#juegos", "#vortex-live", "#aigoritmo", "#cs"]) {
    await expect(page.locator(`.cover-node[href="${hash}"]`)).toHaveCount(1);
  }
  await expect(page.locator("#lab-field")).toHaveAttribute("data-motion", "static");
  await expect(page.locator(".hero-rail")).toHaveCount(0);
  await expect(page.locator("a[href^='http://127.0.0.1:8001']")).toHaveCount(0);
  await expect(page.locator(".lab-more-card").first().locator("a")).toHaveAttribute("href", "https://gracianb.github.io/revops-studio/demo.html");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  expect(overflow).toBe(false);
});

test("P30 optional agent iframe loads only after explicit disclosure", async ({ page }) => {
  await page.goto("/?lang=en");
  const frame = page.locator("#agente iframe");
  await expect(frame).not.toHaveAttribute("src", /embed=1/);
  await page.locator("#agente summary").click();
  await expect(frame).toHaveAttribute("src", /embed=1/);
  await expect(page.frameLocator("#agente iframe").locator("#disclaimer")).toContainText("fictional");
});
