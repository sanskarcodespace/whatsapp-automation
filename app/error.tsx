"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="simple">
      <h1>Something didn’t load.</h1>
      <p className="muted my-5">
        Please try again. For local setup, check that Supabase is running and
        .env.local is configured.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
