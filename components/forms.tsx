"use client";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";
type Action = (state: FormState, form: FormData) => Promise<FormState>;
export function ActionForm({
  action,
  children,
  label,
}: {
  action: Action;
  children: React.ReactNode;
  label: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="space-y-5">
      {children}
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice">
          {state.success}
        </p>
      )}
      <button disabled={pending} className="button" type="submit">
        {pending ? "Please wait…" : label}
      </button>
    </form>
  );
}
export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
export function BusinessFields({
  business,
}: {
  business?: {
    name: string;
    industry: string;
    description: string;
    timezone: string;
    retention_days: number;
  };
}) {
  return (
    <>
      <Field
        label="Business name"
        name="name"
        required
        minLength={2}
        maxLength={120}
        defaultValue={business?.name}
      />
      <label className="field">
        <span>Industry</span>
        <select name="industry" defaultValue={business?.industry ?? "property"}>
          <option value="property">Property broker</option>
          <option value="gym">Gym & fitness</option>
          <option value="other">Other business</option>
        </select>
      </label>
      <label className="field">
        <span>About your business</span>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={business?.description}
        />
      </label>
      <Field
        label="Timezone"
        name="timezone"
        required
        defaultValue={business?.timezone ?? "Asia/Kolkata"}
      />
      <Field
        label="Data retention preference (days)"
        name="retention_days"
        type="number"
        min={7}
        max={3650}
        required
        defaultValue={business?.retention_days ?? 90}
      />
      <p className="muted text-sm">
        Retention is saved as a preference. Automated deletion will be
        implemented with background processing in a later phase.
      </p>
    </>
  );
}
