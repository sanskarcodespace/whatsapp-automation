import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Brand, Card, Heading, Badge } from "@/components/ui";
import { signout } from "./actions";
export default async function Home() {
  const { db, user } = await requireUser();
  const { data: memberships, error } = await db
    .from("memberships")
    .select("business_id,role,businesses(name,industry)")
    .eq("user_id", user.id);
  if (error) throw new Error("Unable to load workspaces");
  const { data: admin } = await db.rpc("is_super_admin");
  return (
    <main className="simple">
      <Brand />
      <div className="flex justify-between items-start gap-4">
        <Heading
          eyebrow="YOUR WORKSPACES"
          title="Good to have you here."
          description="Choose a business to pick up where you left off."
        />
        <form action={signout}>
          <button className="button secondary">Sign out</button>
        </form>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {memberships?.map((m) => {
          const b = m.businesses as unknown as {
            name: string;
            industry: string;
          };
          return (
            <Link key={m.business_id} href={`/business/${m.business_id}`}>
              <Card>
                <Badge>{m.role}</Badge>
                <h2 className="mt-5">{b.name}</h2>
                <p className="muted text-sm mt-2 capitalize">
                  {b.industry} · Open workspace →
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-8">
        <Link className="button" href="/onboarding">
          Create a business
        </Link>
        {admin && (
          <Link className="button secondary" href="/admin">
            Platform administration
          </Link>
        )}
      </div>
    </main>
  );
}
