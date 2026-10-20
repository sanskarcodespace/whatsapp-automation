import Link from "next/link";
export default function NotFound() {
  return (
    <main className="simple">
      <h1>Workspace unavailable</h1>
      <p className="muted my-5">
        This page does not exist or you do not have access.
      </p>
      <Link className="button" href="/">
        Back to workspaces
      </Link>
    </main>
  );
}
