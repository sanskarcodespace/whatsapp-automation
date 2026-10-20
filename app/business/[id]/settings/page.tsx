import { requireBusiness } from "@/lib/auth";
import { Card, Heading } from "@/components/ui";
import { ActionForm, BusinessFields } from "@/components/forms";
import { saveBusiness } from "@/app/actions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { business } = await requireBusiness(id, ["owner", "admin"]);
  return (
    <>
      <Heading
        eyebrow="BUSINESS SETTINGS"
        title="The details that make you, you."
        description="Keep your business profile and workspace preferences up to date."
      />
      <Card className="max-w-2xl">
        <ActionForm action={saveBusiness.bind(null, id)} label="Save settings">
          <BusinessFields business={business} />
        </ActionForm>
      </Card>
    </>
  );
}
