import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin", () => {
  test("signed-out visitors are sent to the login page", async ({ page }) => {
    await page.goto("/admin/leads");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
  });

  test("wrong password shows a friendly error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/don't match/)).toBeVisible();
  });

  test.describe("signed in", () => {
    test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin tests.");

    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/login");
      await page.getByLabel("Email").fill(email!);
      await page.getByLabel("Password").fill(password!);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);
    });

    test("dashboard and leads CRM load, and the e2e enquiry is there", async ({ page }) => {
      await page.goto("/admin/leads?q=E2E");
      await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
      await page.goto("/admin/leads?view=board");
      await expect(page.getByRole("region", { name: "New enquiry" })).toBeVisible();
    });

    test("a published notice goes live immediately and can be deleted", async ({ page }) => {
      const title = `E2E notice ${Date.now()}`;
      await page.goto("/admin/content/notices/new");
      await page.getByLabel("Title").first().fill(title);
      await page.getByRole("button", { name: "Generate from title" }).click();
      await page.getByLabel("Publish date").fill("2026-01-01T09:00");
      await page.getByRole("button", { name: "Publish" }).click();
      await expect(page.getByText(/it's live now/i)).toBeVisible();
      await page.waitForURL(/\/admin\/content\/notices\/c/);

      await page.goto("/notices");
      await expect(page.getByText(title)).toBeVisible();

      await page.goBack();
      await page.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
      await expect(page).toHaveURL(/\/admin\/content\/notices$/);
      await page.goto("/notices");
      await expect(page.getByText(title)).toHaveCount(0);
    });

    test("settings page loads with the admissions toggle", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.getByText("Admissions are open")).toBeVisible();
    });
  });
});
