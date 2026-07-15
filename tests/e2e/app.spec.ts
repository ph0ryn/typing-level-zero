import { expect, test, type Page } from "@playwright/test";

async function readPrompt(page: Page): Promise<string> {
  return (await page.locator(".prompt-character").allTextContents()).join("");
}

async function completePrompt(page: Page): Promise<string> {
  const prompt = await readPrompt(page);

  for (const character of prompt) {
    await page.keyboard.press(character);
  }

  await expect(page.locator(".result-panel")).toBeVisible();

  return prompt;
}

async function countSavedPlays(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const request = indexedDB.open("typing-level-zero");

        request.onerror = () => resolve(-1);

        request.onsuccess = () => {
          const database = request.result;
          const countRequest = database.transaction("runs").objectStore("runs").count();

          countRequest.onerror = () => resolve(-1);

          countRequest.onsuccess = () => {
            resolve(countRequest.result);
            database.close();
          };
        };
      }),
  );
}

test.describe("Typing Level Zero", () => {
  test("completes a play, persists history, and opens deep routes", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".play-kicker")).toHaveText("集中して10文字を入力する");

    await expect(
      page.locator(".top-navigation .nav-link").filter({ hasText: "/history" }),
    ).toBeVisible();

    const navigationWidths = await page
      .locator(".top-navigation")
      .evaluate((element) =>
        Array.from(element.querySelectorAll(".nav-link"), (link) =>
          Math.round(link.getBoundingClientRect().width),
        ),
      );

    expect(new Set(navigationWidths).size).toBe(1);

    const activeUnderlineBottom = await page
      .locator(".nav-link.active")
      .evaluate((element) => getComputedStyle(element, "::after").bottom);

    expect(activeUnderlineBottom).toBe("0px");

    await expect(page.locator(".side-navigation")).toHaveCount(0);
    await expect(page.locator(".play-stats")).not.toContainText("リセット");

    const promptBeforeResult = await page.locator(".prompt").boundingBox();
    const prompt = await completePrompt(page);

    const promptAfterResult = await page.locator(".prompt").boundingBox();
    const resultPanel = await page.locator(".result-panel").boundingBox();
    const footer = await page.locator(".play-footer").boundingBox();

    expect(Math.abs((promptAfterResult?.y ?? 0) - (promptBeforeResult?.y ?? 0))).toBeLessThan(1);
    expect(footer?.y ?? 0).toBeGreaterThan(resultPanel?.y ?? 0);

    await expect.poll(() => countSavedPlays(page), { timeout: 10_000 }).toBe(1);

    await page.goto("history");

    await expect(page.locator(".history-table tbody tr")).toHaveCount(1);
    await expect(page.locator(".history-table")).not.toContainText("リセット");
    await expect(page.locator(".prompt-cell")).toHaveText(prompt);

    await page.locator(".history-table .row-link").click();
    await expect(page.locator("h1")).toHaveText("プレイ詳細");
    await expect(page.locator(".page-history-detail")).not.toContainText("リセット");
    await expect(page.locator(".event-table tbody tr")).toHaveCount(9);

    await page.reload();
    await expect(page.locator(".event-table tbody tr")).toHaveCount(9);

    await page.goto("analysis");
    await expect(page.locator("h1")).toHaveText("分析");
    await expect(page.locator(".page-analysis")).not.toContainText("リセット");
    await expect(page.locator(".page-analysis .page-intro-action")).toHaveCount(0);
    await expect(page.locator(".side-navigation")).toHaveCount(0);

    await page.goto("keys");
    await expect(page.locator("h1")).toHaveText("キー別分析");
  });

  test("ignores a wrong first input and cancels with Escape", async ({ page }) => {
    await page.goto("/");

    const prompt = await readPrompt(page);
    const wrongKey = prompt.startsWith("z") ? "y" : "z";

    await page.keyboard.press(wrongKey);
    await expect(page.locator(".progress-dot.filled")).toHaveCount(0);
    await expect(page.locator(".play-stats")).toContainText("ミス 0");

    await page.keyboard.press("Escape");
    await expect(page.locator(".play-hint")).toContainText("アルファベットキーを押すとスタート");

    const nextPrompt = await readPrompt(page);

    expect(nextPrompt).not.toBe(prompt);
  });

  test("persists the selected theme and deletes all local history", async ({ page }) => {
    await page.goto("/");
    await completePrompt(page);

    const themeButton = page.getByRole("button", { name: "ダークテーマに切り替える" });

    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.goto("analysis");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "すべて削除" }).click();
    await expect(page.locator(".empty-state")).toBeVisible();
  });

  test("keeps the header aligned across dashboard routes", async ({ page }) => {
    const positions = [];

    for (const route of ["analysis", "keys", "history"]) {
      await page.goto(route);

      positions.push(
        await page.locator(".topbar").evaluate((element) => {
          const brand = element.querySelector(".brand")?.getBoundingClientRect();
          const navigation = element.querySelector(".top-navigation")?.getBoundingClientRect();
          const themeButton = element.querySelector(".icon-button")?.getBoundingClientRect();

          return {
            brandX: brand?.x ?? null,
            navigationX: navigation?.x ?? null,
            themeX: themeButton?.x ?? null,
          };
        }),
      );
    }

    expect(positions[1]).toEqual(positions[0]);
    expect(positions[2]).toEqual(positions[0]);
  });

  test("uses equal navigation hit areas on narrow screens", async ({ page }) => {
    await page.setViewportSize({ height: 928, width: 598 });
    await page.goto("/");

    const navigationWidths = await page
      .locator(".top-navigation")
      .evaluate((element) =>
        Array.from(element.querySelectorAll(".nav-link"), (link) =>
          Math.round(link.getBoundingClientRect().width),
        ),
      );

    expect(new Set(navigationWidths).size).toBe(1);
  });

  test("keeps the play page within the viewport after a result appears", async ({ page }) => {
    for (const viewport of [
      { height: 320, width: 568 },
      { height: 400, width: 1280 },
      { height: 568, width: 320 },
      { height: 844, width: 390 },
      { height: 600, width: 768 },
      { height: 720, width: 1280 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await completePrompt(page);

      const dimensions = await page.locator("main").evaluate((element) => ({
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        mainClientHeight: element.clientHeight,
        mainClientWidth: element.clientWidth,
        mainOverflow: getComputedStyle(element).overflow,
        mainScrollHeight: element.scrollHeight,
        mainScrollWidth: element.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }));

      expect(dimensions.documentHeight).toBe(dimensions.viewportHeight);
      expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
      expect(dimensions.mainScrollHeight).toBe(dimensions.mainClientHeight);
      expect(dimensions.mainScrollWidth).toBe(dimensions.mainClientWidth);
      expect(dimensions.mainOverflow).toBe("hidden");
    }
  });
});
