import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
const broker = "10000000-0000-4000-8000-000000000001",
  gym = "10000000-0000-4000-8000-000000000002";
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("LocalDemo!2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");
}
test("broker and gym have independent dashboards; cross-business and admin routes denied", async ({
  page,
}) => {
  await login(page, "broker@example.test");
  await page
    .getByRole("link")
    .filter({ hasText: "Skyline Properties" })
    .click();
  await expect(
    page.getByText("Sample home buyer", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Sample fitness member", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.goto(`/business/${gym}`);
  await expect(
    page.getByRole("heading", { name: "Workspace unavailable" }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Workspace unavailable" }),
  ).toBeVisible();
  await page.goto(`/business/${broker}`);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/login");
  await login(page, "gym@example.test");
  await page.goto(`/business/${gym}`);
  await expect(
    page.getByText("Sample fitness member", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Sample home buyer", { exact: true }),
  ).toHaveCount(0);
});
test("viewer cannot manage settings or team; anonymous session redirects", async ({
  page,
}) => {
  await page.goto(`/business/${broker}`);
  await expect(page).toHaveURL("/login");
  await login(page, "viewer@example.test");
  await page.goto(`/business/${broker}`);
  await expect(
    page.getByText("Sample home buyer", { exact: true }),
  ).toBeVisible();
  for (const path of ["settings", "team"]) {
    await page.goto(`/business/${broker}/${path}`);
    await expect(
      page.getByRole("heading", { name: "Workspace unavailable" }),
    ).toBeVisible();
  }
});
test("super-admin sees business registry but no tenant dashboard", async ({
  page,
}) => {
  await login(page, "admin@example.test");
  await page.goto("/admin");
  await expect(
    page.getByRole("cell", { name: "Skyline Properties" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Momentum Fitness" }),
  ).toBeVisible();
  await page.goto(`/business/${broker}`);
  await expect(
    page.getByRole("heading", { name: "Workspace unavailable" }),
  ).toBeVisible();
});
test("owner can update settings and add/change/remove a verified team member", async ({
  page,
}) => {
  await login(page, "broker@example.test");
  await page.goto(`/business/${broker}/settings`);
  await page
    .getByLabel("About your business")
    .fill("Independent property advisory in Pune.");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status")).toHaveText("Business settings saved.");
  await page.goto(`/business/${broker}/team`);
  await page.getByLabel("Teammate email").fill("gym@example.test");
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("agent");
  await page.getByRole("button", { name: "Update membership" }).click();
  await expect(
    page.getByRole("cell", { name: "gym@example.test" }),
  ).toBeVisible();
  await page.getByLabel("Teammate email").fill("gym@example.test");
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("remove");
  await page.getByRole("button", { name: "Update membership" }).click();
  await expect(
    page.getByRole("cell", { name: "gym@example.test" }),
  ).toHaveCount(0);
});
test("business onboarding creates owner membership and isolated empty dashboard", async ({
  page,
}) => {
  await login(page, "broker@example.test");
  await page.goto("/onboarding");
  await page.getByLabel("Business name").fill("Onboarding test workspace");
  await page
    .getByRole("button", { name: "Create business", exact: true })
    .click();
  await expect(page).toHaveURL(/\/business\/[a-f0-9-]+$/);
  await expect(page.getByText("No leads yet.", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Business settings" }).click();
  await expect(page.getByLabel("Business name")).toHaveValue(
    "Onboarding test workspace",
  );
});
test("direct API requests cannot cross tenants, promote viewers, or forge usage", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({
    email: "viewer@example.test",
    password: "LocalDemo!2026",
  });
  expect(error).toBeNull();
  const other = await db.from("leads").select("*").eq("business_id", gym);
  expect(other.error).toBeNull();
  expect(other.data).toEqual([]);
  const promotion = await db.rpc("manage_member", {
    tenant: broker,
    member_email: "viewer@example.test",
    new_role: "admin",
  });
  expect(promotion.error).not.toBeNull();
  const usage = await db
    .from("usage_records")
    .insert({ business_id: broker, metric: "messages", quantity: 0 });
  expect(usage.error).not.toBeNull();
  const update = await db
    .from("businesses")
    .update({ name: "Unauthorized" })
    .eq("id", broker)
    .select();
  expect(update.data ?? []).toEqual([]);
  await db.auth.signOut();
  const anonymous = await db.rpc("create_business", {
    p_name: "Unauthorized",
    p_industry: "gym",
    p_description: "",
    p_timezone: "UTC",
    p_retention_days: 90,
  });
  expect(anonymous.error).not.toBeNull();
});
test("signup creates a session in local development", async ({ page }) => {
  await page.goto("/signup");
  await page
    .getByLabel("Email address")
    .fill(`signup-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("LocalDemo!2026");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL("/onboarding");
});
test("mobile login remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
