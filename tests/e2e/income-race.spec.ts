import { test, expect } from "@playwright/test";

// Repro for the input-value-drops-on-immediate-map-click race: typing an
// income and clicking a 시/도 (province) before ever blurring the field used
// to navigate with the stale default income baked into the URL, because
// KrInputPanel only committed the typed value on blur while the map/list
// click handlers read the URL's current `?d=` at click time — see
// components/kr/KrInputPanel.tsx's IncomeField for the fix.

const TYPED_INCOME = "5555";

test("typing income then immediately clicking a region carries the typed value", async ({ page }) => {
  await page.goto("/");

  const incomeInput = page.getByTestId("kr-income-input");
  await incomeInput.fill(TYPED_INCOME);

  // Deliberately do NOT blur — click straight into the region list without
  // clicking/tabbing anywhere else first, the exact sequence that used to
  // drop the typed value.
  await page.getByRole("button", { name: /^서울특별시/ }).click();

  await page.waitForURL(/\/seoul(\?|$)/);
  const url = new URL(page.url());
  expect(url.searchParams.get("d")).toBe(TYPED_INCOME);

  // The region page's own header should reflect the typed income, not the
  // 4,000만 default.
  await expect(page.getByTestId("kr-income-summary")).toHaveText("5,555만");

  // Follow through to the result page and confirm the value survives there too.
  await page.getByRole("link", { name: /평균 기준으로 결과 보기/ }).click();
  await page.waitForURL(/\/result(\?|$)/);
  const resultUrl = new URL(page.url());
  expect(resultUrl.searchParams.get("d")).toBe(TYPED_INCOME);
  await expect(page.getByTestId("kr-income-summary")).toHaveText("5,555만");
});
