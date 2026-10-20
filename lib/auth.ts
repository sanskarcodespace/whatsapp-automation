import "server-only";
import { database } from "./supabase";
import { notFound, redirect } from "next/navigation";
import { businessId } from "./validation";
export async function requireUser() {
  const db = await database();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  return { db, user };
}
export async function requireBusiness(id: string, roles?: string[]) {
  if (!businessId.safeParse(id).success) notFound();
  const { db, user } = await requireUser();
  const { data: membership, error } = await db
    .from("memberships")
    .select("role")
    .eq("business_id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !membership || (roles && !roles.includes(membership.role)))
    notFound();
  const { data: business, error: businessError } = await db
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();
  if (businessError || !business) notFound();
  return { db, user, business, role: membership.role as string };
}
export async function requireSuperAdmin() {
  const { db, user } = await requireUser();
  const { data, error } = await db.rpc("is_super_admin");
  if (error || !data) notFound();
  return { db, user };
}
