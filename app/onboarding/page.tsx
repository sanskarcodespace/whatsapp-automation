import { requireUser } from "@/lib/auth";
import { Brand, Card, Heading } from "@/components/ui";
import { ActionForm, BusinessFields } from "@/components/forms";
import { createBusiness } from "../actions";
export default async function Page() {
  await requireUser();
  return (
    <main className="simple max-w-2xl">
      <Brand />
      <Heading
        eyebrow="SET UP YOUR WORKSPACE"
        title="Make yourself at home."
        description="Tell us about your business. You can update these details anytime."
      />
      <Card>
        <ActionForm action={createBusiness} label="Create business">
          <BusinessFields />
        </ActionForm>
      </Card>
    </main>
  );
}
