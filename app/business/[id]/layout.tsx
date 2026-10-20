import Link from "next/link";
import { requireBusiness } from "@/lib/auth";
import { canManage } from "@/lib/validation";
import { Brand, Badge } from "@/components/ui";
import { signout } from "@/app/actions";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { business, role, user } = await requireBusiness(id);
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h2>{business.name}</h2>
          <div className="mt-3">
            <Badge>{role}</Badge>
          </div>
        </div>
        <nav aria-label="Workspace navigation">
          <Link href={`/business/${id}`}>Overview</Link>
          {canManage(role) && (
            <>
              <Link href={`/business/${id}/team`}>Team members</Link>
              <Link href={`/business/${id}/settings`}>Business settings</Link>
            </>
          )}
          <Link href="/">Switch business</Link>
        </nav>
        <div className="sidebar-footer mt-auto text-xs muted leading-6">
          Your workspace, connected.
          <br />
          WhatsApp and AI setup coming later.
        </div>
      </aside>
      <main className="workspace">
        <div className="topbar">
          <span>Workspace / {business.name}</span>
          <div className="flex gap-4 items-center">
            <span>{user.email}</span>
            <form action={signout}>
              <button className="link">Sign out</button>
            </form>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
