import { test, expect } from "@playwright/test";

// components/ShareButtons.tsx existed fully wired (Web Share/clipboard,
// html-to-image card/story saves) but nothing on /result actually rendered
// it — see components/kr/KrResultDashboard.tsx's ShareButtons/KrShareCard
// wiring. This covers the wiring itself: the buttons render with a real
// result on screen, and each one produces a visible effect (toast text or a
// download) instead of doing nothing.

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

test("share buttons render on /result and each action does something", async ({ page }) => {
  await page.goto("/result?region=seoul&gu=seoul-gangnam&d=6000");

  await expect(page.getByRole("button", { name: "공유하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이미지 저장" })).toBeVisible();
  await expect(page.getByRole("button", { name: "스토리 저장" })).toBeVisible();
  await expect(page.getByRole("button", { name: "카카오톡 공유" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/\d+\.\d{4,}%/);
  const cardText = (await page.locator('[aria-hidden="true"]').allTextContents()).join(" ");
  expect(cardText).toContain("krsalaryrank.netlify.app");
  expect(cardText).not.toContain("localhost:3000");
  const shareCards = page.locator('[aria-hidden="true"]').filter({ hasText: "연봉 밸런스" });
  await expect(shareCards).toHaveCount(2);
  const cardLayout = await shareCards.evaluateAll((cards) =>
    cards.map((card) => ({
      width: Math.round(card.getBoundingClientRect().width),
      height: Math.round(card.getBoundingClientRect().height),
      contentFits: card.scrollHeight <= card.clientHeight,
    }))
  );
  expect(cardLayout).toEqual([
    { width: 400, height: 540, contentFits: true },
    { width: 405, height: 720, contentFits: true },
  ]);

  // navigator.share is unavailable in headless Chromium, so "공유하기" falls
  // back to copying the URL — same clipboard fallback path as 카카오톡 공유.
  await page.getByRole("button", { name: "공유하기" }).click();
  await expect(page.getByText("링크 복사됨!")).toBeVisible();

  await page.getByRole("button", { name: "카카오톡 공유" }).click();
  await expect(page.getByText("공유 문구가 복사됐어요")).toBeVisible();
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("소득 상위");
  expect(clipboardText).toContain("(추정)");
  expect(clipboardText).toContain("/result?region=seoul&gu=seoul-gangnam&d=6000");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "이미지 저장" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("income-rank-seoul-seoul-gangnam.png");
});

test("mobile result controls and input panel fit without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/result?region=seoul&gu=seoul-gangnam&d=6000");

  const pageWidth = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  await expect(page.getByRole("button", { name: "공유하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이미지 저장" })).toBeVisible();
  await expect(page.getByRole("button", { name: "스토리 저장" })).toBeVisible();
  await expect(page.getByRole("button", { name: "카카오톡 공유" })).toBeVisible();
  expect(await pageWidth()).toBe(true);

  await page.getByRole("button", { name: "Expand input panel" }).click();
  await expect(page.getByTestId("kr-income-input")).toBeVisible();
  expect(await pageWidth()).toBe(true);
  await page.getByRole("button", { name: "Collapse input panel" }).click();
  await expect(page.getByTestId("kr-income-input")).toBeHidden();
  expect(await pageWidth()).toBe(true);
});

test("mobile region map and list fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /내 소득 상위/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.goto("/seoul");

  await expect(page.getByRole("heading", { name: /서울특별시/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("insight articles are reachable and included in the sitemap", async ({ page, request }) => {
  await page.goto("/insights");
  await expect(page.getByRole("heading", { name: "소득 통계 읽을거리" })).toBeVisible();
  await page.getByRole("link", { name: /2023년 시·도별 근로소득 평균/ }).click();
  await expect(page.getByRole("heading", { name: /2023년 시·도별 근로소득 평균/ })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(18);

  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const sitemap = await response.text();
  expect(sitemap).toContain("/insights/2023-sido-average-income");
  expect(sitemap).toContain("/insights/seoul-district-income-gap");
  expect(sitemap).toContain("/insights/how-income-percentile-estimate-works");
});
