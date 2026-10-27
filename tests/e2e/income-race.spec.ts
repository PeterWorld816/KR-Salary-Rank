import { test, expect } from "@playwright/test";

// Repro for the input-value-drops-on-immediate-map-click race: typing an
// income and clicking a 시/도 before ever blurring the field used to navigate
// with the stale default income — see components/kr/KrInputPanel.tsx's
// IncomeField. The input now lives in lib/krInputStore.ts, never the URL.

const TYPED_INCOME = "5555";

test("typing income then immediately clicking a region carries the typed value, with a clean URL", async ({ page }) => {
  await page.goto("/");

  const incomeInput = page.getByTestId("kr-income-input");
  await incomeInput.fill(TYPED_INCOME);
  expect(new URL(page.url()).search).toBe("");

  // Deliberately do NOT blur — click straight into the region list.
  await page.getByRole("button", { name: /서울특별시 시군구 상세 가능/ }).click();

  await page.waitForURL(/\/seoul$/);
  await expect(page.getByTestId("kr-income-summary")).toHaveText("5,555만");

  await page.getByRole("link", { name: /평균 기준으로 결과 보기/ }).click();
  await page.waitForURL(/\/result\?region=seoul$/);
  const resultUrl = new URL(page.url());
  expect(resultUrl.searchParams.has("d")).toBe(false);
  expect(resultUrl.searchParams.has("o")).toBe(false);
  await expect(page.getByTestId("kr-income-summary")).toHaveText("5,555만");

  // Back to another 시/도: still no income in the address bar, value kept.
  await page.goto("/busan");
  expect(new URL(page.url()).search).toBe("");
  await expect(page.getByTestId("kr-income-summary")).toHaveText("5,555만");
});

test("share links and legacy ?d= links restore the input, then clean the URL", async ({ browser }) => {
  // Fresh context = empty sessionStorage, like a friend opening the link.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/result?region=seoul&gu=seoul-gangnam&d=7777&o=general");
  await expect(page.getByTestId("kr-income-summary")).toHaveText("7,777만");
  await expect.poll(() => new URL(page.url()).search).toBe("?region=seoul&gu=seoul-gangnam");

  await page.goto("/gyeonggi?d=3333");
  await expect(page.getByTestId("kr-income-summary")).toHaveText("3,333만");
  await expect.poll(() => new URL(page.url()).search).toBe("");
  await context.close();
});
