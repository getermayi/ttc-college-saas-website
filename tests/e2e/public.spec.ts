import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "/",
  "/about",
  "/programmes",
  "/programmes/bed",
  "/admissions",
  "/enquire",
  "/notices",
  "/faculty",
  "/campus",
  "/events",
  "/gallery",
  "/disclosures",
  "/contact",
  "/grievance",
  "/privacy-policy",
];

test.describe("public site", () => {
  test("home shows the hero, trust strip and a clear call to action", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("RGU affiliated").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Check eligibility & enquire/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Apply" })).toBeVisible(); // mobile bottom bar
  });

  for (const path of PAGES) {
    test(`${path} renders with one h1, metadata and no serious a11y violations`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/.+/);
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
      expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .exclude("iframe")
        .analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("programmes marked VERIFY are never public", async ({ page, request }) => {
    expect((await request.get("/programmes/ba")).status()).toBe(404);
    expect((await request.get("/programmes/bsc")).status()).toBe(404);
    await page.goto("/programmes");
    await expect(page.getByText("Bachelor of Arts")).toHaveCount(0);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/programmes/bed");
    expect(sitemap).not.toContain("/programmes/ba<");
  });

  test("B.Ed. page shows verified facts and no invented fees", async ({ page }) => {
    await page.goto("/programmes/bed");
    await expect(page.getByText("100 seats").first()).toBeVisible();
    await expect(page.getByText(/will be published here once confirmed/)).toBeVisible();
  });

  test("robots.txt blocks admin and unknown pages return 404", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect((await request.get("/this-page-does-not-exist")).status()).toBe(404);
  });

  test("notices can be filtered by category", async ({ page }) => {
    await page.goto("/notices");
    await page.getByRole("button", { name: /^Exam/ }).click();
    await expect(page.getByRole("button", { name: /^Exam/ })).toHaveAttribute("aria-pressed", "true");
  });
});
