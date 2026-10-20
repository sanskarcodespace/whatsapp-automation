# Wavelength — WhatsApp SaaS foundation

Phase 1 of a shared, multi-tenant business platform. Next.js 16, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL, private Storage and pgvector. No live WhatsApp, AI, billing, or outbound integrations are connected.

## Local development

Prerequisites: Node.js 22+, npm, Supabase CLI, and a running Docker-compatible engine. This project uses ports **56321–56329** to avoid common local Supabase conflicts; the web app uses port **3000**.

```sh
npm ci
supabase start
node scripts/local-env.mjs
npm run dev
```

Open http://localhost:3000. `scripts/local-env.mjs` writes only the local URL and public API key into ignored `.env.local`, and refuses to overwrite existing settings. Alternatively copy `.env.example` and use the local public key from `supabase status`. The web application needs **no service-role key**.

The first start applies the migration and seed. To reset **this local project's** disposable data, run `npm run db:reset`. Local signup skips email confirmation for testing. Hosted environments must enable email confirmation and production auth protections. Local email is captured by Supabase's mail service.

| Local account       | Password       | Access                    |
| ------------------- | -------------- | ------------------------- |
| broker@example.test | LocalDemo!2026 | Skyline Properties owner  |
| gym@example.test    | LocalDemo!2026 | Momentum Fitness owner    |
| viewer@example.test | LocalDemo!2026 | Skyline Properties viewer |
| admin@example.test  | LocalDemo!2026 | Platform super-admin      |

These are deliberately known **local-only** credentials, not API credentials. Never run `supabase/seed.sql` in a hosted environment.

## Implemented flows

- Email/password signup, login, server-validated sessions, refresh and logout.
- Workspace chooser and atomic business creation with owner membership.
- Tenant dashboard with independent lead, conversation and team counts.
- Business profile, industry, timezone and retention preference settings.
- Owner-managed membership for already verified accounts: add, change role, remove. No email is sent.
- Platform administrator business registry, without automatic access to private tenant CRM.
- Responsive shared forms, cards, navigation, loading/error/empty states.

## Authorization model

| Role   | Read own workspace | Edit business settings | View team emails | Manage memberships |
| ------ | ------------------ | ---------------------- | ---------------- | ------------------ |
| Owner  | Yes                | Yes                    | Yes              | Yes                |
| Admin  | Yes                | Yes                    | Yes              | No                 |
| Agent  | Yes                | No                     | No               | No                 |
| Viewer | Yes                | No                     | No               | No                 |

Agent and viewer capabilities intentionally match until operational CRM writes are introduced in a later phase. Owner transfer and account deletion are not exposed in Phase 1.

All thirteen domain tables enforce RLS. Server pages and mutations independently validate authenticated membership. Browser-facing requests use the signed-in user's permissions; the web app never uses a privileged database client. Tenant-scoped composite foreign keys prevent contacts/conversations from being linked across businesses.

Membership writes and onboarding use narrow security-definer database functions with fixed search paths and explicit grants. Clients cannot directly assign roles. Owner membership is immutable through the application. Super-admin status lives in an unexposed `private` schema, never in editable user metadata. Provision super-admins only through a trusted operator's database connection; no self-promotion API exists.

Operational tables are read-only for tenant clients during this phase. Usage writes are reserved for future trusted processing. Storage is private, tenant-folder reads are restricted, and uploads remain disabled. There are no provider secrets in public tables. Future integration credentials must use a trusted server-side vault.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run db:test
npx playwright install chromium
npm run test:e2e
```

Database tests run inside a rolled-back transaction. E2E tests use **only the local seeded stack**, exercise browser auth, isolated dashboards, denied routes, direct API authorization, onboarding, settings and membership changes. E2E signup/onboarding creates disposable records; reset the local database before rerunning database assertions that check exact seed counts. Do not point E2E tests at staging or production.

## Repository map

- `app/`: server-rendered pages and authenticated server actions.
- `lib/auth.ts`: reusable server authorization boundary.
- `lib/supabase.ts`, `proxy.ts`: server cookie sessions and refresh.
- `supabase/migrations/`: schema, tenant constraints, RLS, and restricted RPCs.
- `supabase/tests/`: real database isolation assertions.
- `tests/e2e/`: real browser and direct Supabase API tests.

## Environment separation and Phase 1 limits

Use separate Supabase projects, deployments, and secrets for development, staging and production. Never link local automation to production. Enable hosted email verification, configure an approved SMTP provider and redirect allowlist, and retain Auth rate limiting before accepting real customers. The confirmation route supports both PKCE codes and email token hashes; custom confirmation templates should link to `/auth/confirm?token_hash={{ .TokenHash }}` on the approved application origin.

The retention setting is a saved preference, not a running deletion policy. AI settings, style profiles, authorized chat imports, knowledge, appointments, WhatsApp metadata and usage schemas exist for future phases; their operational workflows are not implemented. The platform registry displays the newest 100 businesses with a total count. Password recovery, invitation emails, owner transfer, MFA, audit events, billing enforcement, Redis/BullMQ workers and automated deletion are deferred. No background worker is needed for Phase 1's synchronous operations.

Production builds use the supported Webpack bundler because Turbopack build subprocesses cannot bind their internal port in this workstation environment. Development uses the default Turbopack bundler. To test the compiled app, run `E2E_PRODUCTION=1 npm run test:e2e` after building.

Dependency review: production dependencies have no reported npm audit vulnerabilities. The development-only Next.js ESLint toolchain currently includes a `braces` stack-exhaustion advisory (GHSA-vfj7-8cjw-p6xm), propagated through five package entries. npm suggests an incompatible major downgrade; no forced downgrade was applied. Lint only trusted repository paths while awaiting an upstream fix.
