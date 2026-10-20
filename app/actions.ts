"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/supabase";
import { requireBusiness, requireUser } from "@/lib/auth";
import { businessInput, credentials, roleInput } from "@/lib/validation";
export type FormState = { error?: string; success?: string };
export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Enter a valid email and a password of 12–128 characters.",
    };
  const db = await database();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error: "Unable to sign in. Check your credentials and verify your email.",
    };
  redirect("/");
}
export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Enter a valid email and a password of 12–128 characters.",
    };
  const db = await database();
  const { data, error } = await db.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  });
  if (error) return { error: "Unable to create an account. Try again later." };
  if (data.session) redirect("/onboarding");
  return { success: "Check your email to confirm your account, then sign in." };
}
export async function signout() {
  const db = await database();
  const { error } = await db.auth.signOut();
  if (error) throw new Error("Sign out failed. Please retry.");
  redirect("/login");
}
export async function createBusiness(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { db } = await requireUser();
  const parsed = businessInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { data, error } = await db.rpc("create_business", {
    p_name: v.name,
    p_industry: v.industry,
    p_description: v.description,
    p_timezone: v.timezone,
    p_retention_days: v.retention_days,
  });
  if (error)
    return {
      error: "Business creation failed. Check your details and try again.",
    };
  redirect(`/business/${data}`);
}
export async function saveBusiness(
  id: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { db } = await requireBusiness(id, ["owner", "admin"]);
  const parsed = businessInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await db
    .from("businesses")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: "Settings could not be saved." };
  revalidatePath(`/business/${id}`, "layout");
  return { success: "Business settings saved." };
}
export async function manageMember(
  id: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const { db } = await requireBusiness(id, ["owner"]);
  const role = form.get("role");
  const email = String(form.get("email") ?? "").trim();
  if (
    !email.includes("@") ||
    email.length > 254 ||
    (role !== "remove" && !roleInput.safeParse(role).success)
  )
    return { error: "Enter a valid email and role." };
  const { error } = await db.rpc("manage_member", {
    tenant: id,
    member_email: email,
    new_role: role === "remove" ? null : role,
  });
  if (error)
    return {
      error:
        "Unable to update member. Use a verified account; the owner cannot be changed.",
    };
  revalidatePath(`/business/${id}/team`);
  return { success: "Team membership updated." };
}
