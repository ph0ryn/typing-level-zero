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

    await expect(
      page.locator(".top-navigation .nav-link").filter({ hasText: "/history" }),
    ).toBeVisible();

    await expect(page.locator(".side-navigation")).toHaveCount(0);

    const prompt = await completePrompt(page);

    await expect.poll(() => countSavedPlays(page), { timeout: 10_000 }).toBe(1);

    await page.goto("history");

    await expect(page.locator(".history-table tbody tr")).toHaveCount(1);
    await expect(page.locator(".prompt-cell")).toHaveText(prompt);

    await page.locator(".history-table .row-link").click();
    await expect(page.locator("h1")).toHaveText("プレイ詳細");
    await expect(page.locator(".event-table tbody tr")).toHaveCount(9);

    await page.reload();
    await expect(page.locator(".event-table tbody tr")).toHaveCount(9);

    await page.goto("analysis");
    await expect(page.locator("h1")).toHaveText("分析");
    await expect(page.locator(".side-navigation")).toHaveCount(0);

    await page.goto("keys");
    await expect(page.locator("h1")).toHaveText("キー別分析");
  });

  test("ignores a wrong first input and resets with Escape", async ({ page }) => {
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
});
