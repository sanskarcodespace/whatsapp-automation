import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env.local"))
  throw new Error(".env.local exists; refusing to overwrite.");
const status = JSON.parse(
  execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8" }),
);
const url = new URL(status.API_URL);
if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "56321")
  throw new Error("Expected this project’s local Supabase URL.");
writeFileSync(
  ".env.local",
  `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.ANON_KEY}\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n`,
  { mode: 0o600 },
);
console.log(
  "Created .env.local with local public connection settings; no service-role key copied.",
);
