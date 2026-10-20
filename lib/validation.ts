import { z } from "zod";
export const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
});
export const businessInput = z.object({
  name: z.string().trim().min(2).max(120),
  industry: z.enum(["property", "gym", "other"]),
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Invalid timezone"),
  description: z.string().trim().max(2000),
  retention_days: z.coerce.number().int().min(7).max(3650),
});
export const roleInput = z.enum(["admin", "agent", "viewer"]);
export const businessId = z.uuid();
export function canManage(role: string) {
  return role === "owner" || role === "admin";
}
