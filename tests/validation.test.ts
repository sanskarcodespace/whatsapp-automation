import { describe, it, expect } from "vitest";
import {
  credentials,
  businessInput,
  canManage,
  roleInput,
} from "../lib/validation";
describe("input boundaries", () => {
  it("rejects weak credentials and malformed email", () => {
    expect(
      credentials.safeParse({ email: "invalid", password: "123" }).success,
    ).toBe(false);
    expect(
      credentials.safeParse({
        email: "owner@example.test",
        password: "LocalDemo!2026",
      }).success,
    ).toBe(true);
  });
  it("validates retention, industry and timezone", () => {
    const valid = {
      name: "A business",
      industry: "gym",
      timezone: "Asia/Kolkata",
      description: "",
      retention_days: "90",
    };
    expect(businessInput.parse(valid).retention_days).toBe(90);
    for (const patch of [
      { retention_days: 0 },
      { retention_days: 4000 },
      { industry: "invalid" },
      { timezone: "not-a-zone" },
      { name: " " },
    ])
      expect(businessInput.safeParse({ ...valid, ...patch }).success).toBe(
        false,
      );
  });
  it("restricts configuration and prevents assigning owner roles", () => {
    expect(canManage("viewer")).toBe(false);
    expect(canManage("agent")).toBe(false);
    expect(canManage("owner")).toBe(true);
    expect(canManage("admin")).toBe(true);
    expect(roleInput.safeParse("owner").success).toBe(false);
    expect(roleInput.safeParse("super_admin").success).toBe(false);
  });
});
