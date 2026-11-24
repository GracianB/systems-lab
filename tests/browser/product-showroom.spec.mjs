import { test, expect } from "@playwright/test";

test("product-first storefront contains seven honest, accessible cards", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?lang=es");
  const gallery = page.locator("#products");
  const cards = gallery.locator(".product-tile");
  await expect(gallery).toBeVisible();
  await expect(cards).toHaveCount(7);
  await expect(gallery.getByRole("heading", { level: 2 })).toHaveText("Tecnología que puedes explorar.");
  await expect(gallery.locator("[data-product-results]")).toContainText("7 productos");
  await expect(gallery.locator("[data-product-status=protected]")).toHaveCount(1);
  await expect(gallery.locator("[data-product-status=private]")).toHaveCount(1);
  await expect(gallery.locator("[data-product-status=demo]")).toHaveCount(2);
  await expect(gallery.locator("[data-product-status=public]")).toHaveCount(2);
  await expect(gallery.locator("[data-product-status=prototype]")).toHaveCount(0);
  await expect(gallery.locator("[data-product-status=case]")).toHaveCount(1);
  await expect(gallery.locator(".product-spotlight a")).toHaveAttribute("href", "https://aigoritmo-universe-lab-gracianbs-projects.vercel.app/");
  await expect(gallery.locator(".product-tile[data-product-status=private] a")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("search, category filters, empty state and clear all work without reloading", async ({ page }) => {
  await page.goto("/?lang=es");
  const cards = page.locator("#products .product-tile");
  const count = async () => cards.locator("visible=true").count();
  await page.locator("[data-product-filter=ai]").click();
  await expect(page.locator("[data-product-filter=ai]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(1);
  await page.locator("[data-product-filter=operations]").click();
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(3);
  await page.locator("[data-product-filter=all]").click();
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(7);
  const search = page.locator("[data-product-search]");
  await search.fill("WebGL");
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(1);
  await expect(page.locator("#products .product-tile:visible h3")).toHaveText("VØRTICE");
  await search.fill("unicorn-nonexistent");
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(0);
  await expect(page.locator("[data-product-results]")).toContainText("Ningún producto coincide");
  await search.press("Escape");
  await expect(search).toHaveValue("");
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(7);
});

test("ES / EN translation changes the storefront and keeps filter selection", async ({ page }) => {
  await page.goto("/?lang=es");
  await page.locator("[data-product-filter=creative]").click();
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(3);
  await page.locator('[data-set-lang="en"]').click();
  await expect(page.locator("#products-title")).toHaveText("Technology you can actually explore.");
  await expect(page.locator("[data-product-search]")).toHaveAttribute("placeholder", "Search products or technologies…");
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(3);
  await expect(page.locator("[data-product-results]")).toContainText("3 products of 7");
  await page.locator('[data-set-lang="es"]').click();
  await expect(page.locator("#products-title")).toHaveText("Tecnología que puedes explorar.");
});

test("desktop, tablet and mobile storefront keep cards in viewport", async ({ page }) => {
  await page.goto("/?lang=en");
  for(const width of [390,640,768,1024,1440]){
    await page.setViewportSize({ width, height: 900 });
    await page.locator("#products").scrollIntoViewIfNeeded();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    expect(overflow,"horizontal overflow at "+width).toBe(false);
    const first=page.locator(".product-tile").first();
    await expect(first).toBeVisible();
    const bounds=await first.boundingBox();
    expect(bounds?.width||0).toBeGreaterThan(270);
    expect(bounds.x,"left card edge at "+width).toBeGreaterThanOrEqual(-1);
    expect(bounds.x+bounds.width,"right card edge at "+width).toBeLessThanOrEqual(width+2);
  }
});

test("no JavaScript still leaves full product catalogue and real links", async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto("/");
  await expect(page.locator("#products .product-tile")).toHaveCount(7);
  await expect(page.locator("#products .product-tile:visible")).toHaveCount(7);
  await expect(page.locator("#products .product-tile[data-product-status=public]")).toHaveCount(2);
  await expect(page.locator("a.product-gallery-link")).toHaveCount(1);
  await context.close();
});


test("no obsolete status legend, no excluded product, current OHANA artwork and playable roster gallery", async ({ page }) => {
  await page.goto("/?lang=es");
  await expect(page.locator(".lab-proof-legend")).toHaveCount(0);
  await expect(page.locator("#products .product-tile")).toHaveCount(7);
  await expect(page.locator("#products img[src$='ohana-v802.svg']")).toHaveCount(1);
  await expect(page.locator(".feat-ohana .project-poster img")).toHaveAttribute("src", "./assets/projects/ohana-v802.svg");
  await expect(page.locator(".feat-ohana .stage-live")).toContainText("ARTE EDITORIAL");
  await expect(page.locator("a.product-gallery-link")).toHaveAttribute("href", "https://gracianb.github.io/project-ohana/gallery.html");
  await expect(page.getByText("GuruSup", { exact:false })).toHaveCount(0);
});
