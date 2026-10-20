import { type NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/supabase";
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const db = await database();
  if (token_hash) {
    const { error } = await db.auth.verifyOtp({ token_hash, type: "email" });
    if (!error)
      return NextResponse.redirect(new URL("/onboarding", request.url));
  } else if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  return NextResponse.redirect(new URL("/login", request.url));
}
