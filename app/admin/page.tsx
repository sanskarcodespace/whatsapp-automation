import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { Brand, Card, Heading, Badge } from "@/components/ui";
export default async function Page() {
  const { db } = await requireSuperAdmin();
  const { data, error, count } = await db
    .from("businesses")
    .select("id,name,industry,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Unable to load businesses");
  return (
    <main className="simple">
      <Brand />
      <Heading
        eyebrow="PLATFORM ADMINISTRATION"
        title="Room for every business."
        description="Platform business registry. Customer conversations and private files remain restricted to their workspace members."
      />
      <Card>
        <p className="muted">Registered businesses</p>
        <p className="metric-value">{count}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Industry</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>
                    <Badge>{b.industry}</Badge>
                  </td>
                  <td>
                    {new Date(b.created_at).toLocaleDateString("en-IN", {
                      timeZone: "UTC",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs muted mt-4">Showing the latest 100 businesses.</p>
      </Card>
      <Link className="link inline-block mt-6" href="/">
        Back to workspaces
      </Link>
    </main>
  );
}
