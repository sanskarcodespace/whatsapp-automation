import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function database() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Configure local Supabase using .env.example.");
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"),
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Server component refresh is handled by proxy. */
        }
      },
    },
  });
}
