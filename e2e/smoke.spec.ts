import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 명상 시작 버튼이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("아침 명상");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("아침 명상");
  await expect(page.getByRole("button", { name: "명상 시작" })).toBeVisible();
});
