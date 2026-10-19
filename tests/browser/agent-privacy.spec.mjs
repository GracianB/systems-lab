import { test, expect } from "@playwright/test";

test("P34 local sample agent has no unusable attachment UI and never issues API requests", async ({ page }) => {
  const apiCalls = [];
  page.on("request", request => {
    if (["fetch", "xhr", "websocket"].includes(request.resourceType())) apiCalls.push(request.url());
  });
  await page.goto("/bodytone-chatbot/frontend/?lang=es");
  await expect(page.locator("#agent-name")).toHaveText("Agente de ejemplo");
  await expect(page.locator("#disclaimer")).toContainText("datos ficticios");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator("#files-label")).toHaveCount(0);
  await expect(page.locator("#messages")).toHaveAttribute("role", "log");
  for (const intent of ["shipping", "invoice", "ticket"]) {
    await page.locator(`[data-intent="${intent}"]`).click();
  }
  await expect(page.locator("#messages")).toContainText("DEMO-4821");
  await expect(page.locator("#messages")).toContainText("DEMO-1904");
  await expect(page.locator("#messages")).toContainText("Simulación: no se ha creado ningún ticket real");
  expect(apiCalls).toEqual([]);
  await page.locator("#reset").click();
  await expect(page.locator("#messages .message")).toHaveCount(1);
});

test("P34 English sample agent is labeled correctly and never handles files", async ({ page }) => {
  await page.goto("/bodytone-chatbot/frontend/?lang=en");
  await expect(page.locator("#agent-name")).toHaveText("Sample support agent");
  await expect(page.locator("#disclaimer")).toContainText("fictional");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator('[data-intent="shipping"]')).toHaveText("Shipping");
  await page.locator('[data-intent="ticket"]').click();
  await expect(page.locator("#messages")).toContainText("no real ticket has been created");
});
