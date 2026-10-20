import { requireBusiness } from "@/lib/auth";
import { Card, Heading, Badge } from "@/components/ui";
import { ActionForm, Field } from "@/components/forms";
import { manageMember } from "@/app/actions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, role } = await requireBusiness(id, ["owner", "admin"]);
  const { data: members, error } = await db.rpc("team_members", { tenant: id });
  if (error) throw new Error("Unable to load team");
  return (
    <>
      <Heading
        eyebrow="YOUR TEAM"
        title="Better, together."
        description="Owners manage membership. Admins manage business settings. Agents and viewers can view the workspace in this phase."
      />
      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members?.map(
                (m: { user_id: string; email: string; role: string }) => (
                  <tr key={m.user_id}>
                    <td>{m.email}</td>
                    <td>
                      <Badge>{m.role}</Badge>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {role === "owner" && (
        <Card className="max-w-xl mt-6">
          <h2 className="mb-3">Add or update a member</h2>
          <p className="muted text-sm mb-6">
            Your teammate must first create and verify an account. Enter their
            email to grant access, change their role, or remove them. No
            invitation email is sent.
          </p>
          <ActionForm
            action={manageMember.bind(null, id)}
            label="Update membership"
          >
            <Field label="Teammate email" name="email" type="email" required />
            <label className="field">
              <span>Role</span>
              <select name="role">
                <option value="viewer">Viewer</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="remove">Remove access</option>
              </select>
            </label>
          </ActionForm>
        </Card>
      )}
    </>
  );
}
