import { expect, test, type Page } from "@playwright/test";

async function pickCategory(page: Page, label: string) {
  await page.locator('form[aria-label="Eligibility checker"] label').filter({ hasText: label }).click();
}

test.describe("eligibility checker", () => {
  test("General with 60% is eligible", async ({ page }) => {
    await page.goto("/admissions");
    await page.getByLabel("1. Your highest qualification").selectOption("BACHELORS");
    await page.getByLabel("2. Marks in that degree (%)").fill("60");
    await pickCategory(page, "General");
    await page.getByRole("button", { name: "Check my eligibility" }).click();
    await expect(page.getByRole("heading", { name: /you are eligible/i })).toBeVisible();
  });

  test("General with 45% is below the minimum", async ({ page }) => {
    await page.goto("/admissions");
    await page.getByLabel("1. Your highest qualification").selectOption("MASTERS");
    await page.getByLabel("2. Marks in that degree (%)").fill("45");
    await pickCategory(page, "General");
    await page.getByRole("button", { name: "Check my eligibility" }).click();
    await expect(page.getByRole("heading", { name: /below the minimum/i })).toBeVisible();
  });

  test("reserved categories see the Government-rules relaxation, not an invented cut-off", async ({
    page,
  }) => {
    await page.goto("/admissions");
    await page.getByLabel("1. Your highest qualification").selectOption("BACHELORS");
    await page.getByLabel("2. Marks in that degree (%)").fill("46");
    await pickCategory(page, "ST (including APST)");
    await page.getByRole("button", { name: "Check my eligibility" }).click();
    await expect(page.getByRole("heading", { name: /likely eligible/i })).toBeVisible();
    await expect(page.getByText(/as per Government rules/i).first()).toBeVisible();
  });
});

test.describe("enquiry form", () => {
  test("shows helpful errors when required fields are missing", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /Send my enquiry/ }).click();
    await expect(page.getByText("Please enter your full name.")).toBeVisible();
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByLabel("Mobile number").blur();
    await expect(page.getByText(/valid 10-digit Indian mobile number/)).toBeVisible();
  });

  test("submits an enquiry with UTM attribution and shows a confirmation", async ({ page }) => {
    await page.goto("/enquire?utm_source=facebook&utm_medium=paid_social&utm_campaign=e2e-test");
    await page.getByLabel("Full name").fill("E2E Test Student");
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Your district").selectOption("West Siang");
    await page.getByLabel(/^Highest qualification/).selectOption("BACHELORS");
    await page.getByLabel(/^Category/).selectOption("ST");
    await page.getByRole("checkbox", { name: /I agree/ }).click();
    await page.getByRole("button", { name: /Send my enquiry/ }).click();
    await expect(page.getByText(/We've got your enquiry/)).toBeVisible({ timeout: 15_000 });
  });
});
