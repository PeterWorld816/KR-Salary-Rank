import { test, expect } from "@playwright/test";

test("newly covered Seoul district is selectable from the official 2023 table", async ({ page }) => {
  await page.goto("/seoul");
  await page.getByPlaceholder("시군구 이름 검색...").fill("중구");

  const junggu = page.locator("button").filter({ hasText: /중구.*5,616만원/ });
  await expect(junggu).toBeEnabled();
  await junggu.click();
  await expect(page).toHaveURL(/\/result\?.*gu=seoul-junggu/);
});

test("Gunwi follows its current Daegu parent despite the older map code", async ({ page }) => {
  await page.goto("/daegu");
  await page.getByPlaceholder("시군구 이름 검색...").fill("군위군");

  const gunwi = page.locator("button").filter({ hasText: /군위군.*3,542만원/ });
  await expect(gunwi).toBeEnabled();
  await gunwi.click();
  await expect(page).toHaveURL(/\/result\?.*gu=daegu-37310/);
});

test("city-wide KOSIS rows are labeled as aggregates, not assigned to ward polygons", async ({ page }) => {
  await page.goto("/gyeonggi");
  await page.getByPlaceholder("시군구 이름 검색...").fill("수원시");

  const suwon = page.getByRole("button", { name: /수원시 시 전체 4,925만원/ });
  const suwonWard = page.getByRole("button", { name: /수원시장안구 — 준비중/ });
  await expect(suwon).toBeEnabled();
  await expect(suwonWard).toBeDisabled();
  await suwon.click();
  await expect(page).toHaveURL(/\/result\?.*gu=gyeonggi-3101-city/);
});

test("Sejong's single-city boundary uses its published province-wide average", async ({ page }) => {
  await page.goto("/sejong");
  await page.getByPlaceholder("시군구 이름 검색...").fill("세종시");

  const sejong = page.getByRole("button", { name: /세종시 시 전체 5,122만원/ });
  await expect(sejong).toBeEnabled();
  await sejong.click();
  await expect(page).toHaveURL(/\/result\?.*gu=sejong-city/);
});
