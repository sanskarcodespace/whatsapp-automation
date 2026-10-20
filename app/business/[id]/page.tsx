import { requireBusiness } from "@/lib/auth";
import { Badge, Card, Heading, Empty } from "@/components/ui";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, business } = await requireBusiness(id);
  const [leads, conversations, members] = await Promise.all([
    db
      .from("leads")
      .select("id,name,stage,notes", { count: "exact" })
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id)
      .eq("status", "open"),
    db
      .from("memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("business_id", id),
  ]);
  if (leads.error || conversations.error || members.error)
    throw new Error("Unable to load dashboard");
  return (
    <>
      <Heading
        eyebrow="BUSINESS OVERVIEW"
        title="A clear view of your day."
        description={`Here’s what’s happening at ${business.name}.`}
      />
      <div className="metrics">
        {[
          ["Total leads", leads.count],
          ["Open conversations", conversations.count],
          ["Team members", members.count],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-sm muted">{label}</p>
            <p className="metric-value">{value ?? 0}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2>Recent leads</h2>
            <p className="muted text-sm mt-1">
              Your latest opportunities, all in one place.
            </p>
          </div>
          <Badge>CRM</Badge>
        </div>
        {leads.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Stage</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {leads.data.map((lead) => (
                  <tr key={lead.id}>
                    <td className="font-medium">{lead.name}</td>
                    <td>
                      <Badge>{lead.stage}</Badge>
                    </td>
                    <td className="muted">{lead.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No leads yet. Your new opportunities will appear here.</Empty>
        )}
      </Card>
      <div className="connection">
        <div>
          <h3>Your workspace is ready</h3>
          <p className="muted text-sm mt-1">
            WhatsApp and AI are disconnected. No messages are being sent.
          </p>
        </div>
        <Badge>Foundation phase</Badge>
      </div>
    </>
  );
}
