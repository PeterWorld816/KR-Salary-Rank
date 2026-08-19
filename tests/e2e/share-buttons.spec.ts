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

  // navigator.share is unavailable in headless Chromium, so "공유하기" falls
  // back to copying the URL — same clipboard fallback path as 카카오톡 공유.
  await page.getByRole("button", { name: "공유하기" }).click();
  await expect(page.getByText("링크 복사됨!")).toBeVisible();

  await page.getByRole("button", { name: "카카오톡 공유" }).click();
  await expect(page.getByText("공유 문구가 복사됐어요")).toBeVisible();
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("소득 상위");
  expect(clipboardText).toContain("/result?region=seoul&gu=seoul-gangnam&d=6000");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "이미지 저장" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("income-rank-seoul-seoul-gangnam.png");
});
