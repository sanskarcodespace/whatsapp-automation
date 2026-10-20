import Link from "next/link";
import { Brand } from "./ui";
import { ActionForm, Field } from "./forms";
import { login, signup } from "@/app/actions";
export function AuthPage({ register = false }: { register?: boolean }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Brand />
        <div>
          <p className="eyebrow">A LITTLE MORE ROOM TO GROW</p>
          <h1>
            Your business.
            <br />
            One connected workspace.
          </h1>
          <p>
            Bring your team, your leads, and your customer relationships
            together. Built around the way you work.
          </p>
        </div>
        <footer className="text-xs">
          Independent businesses. A shared foundation.
        </footer>
      </section>
      <section className="auth-panel">
        <div>
          <p className="eyebrow">LET’S GET STARTED</p>
          <h1>{register ? "Create your account" : "Welcome back"}</h1>
          <p className="muted">
            {register
              ? "A fresh workspace for your next chapter."
              : "Sign in to your business workspace."}
          </p>
          <ActionForm
            action={register ? signup : login}
            label={register ? "Create account" : "Sign in"}
          >
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={12}
              maxLength={128}
            />
            {register && (
              <p className="text-xs muted">Use at least 12 characters.</p>
            )}
          </ActionForm>
          <p className="text-sm muted mt-6">
            {register ? "Already have an account?" : "New here?"}{" "}
            <Link className="link" href={register ? "/login" : "/signup"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
