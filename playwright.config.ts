import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:56321")
  throw new Error("E2E tests require this project’s local Supabase stack.");
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: {
    command: process.env.E2E_PRODUCTION ? "npm start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
