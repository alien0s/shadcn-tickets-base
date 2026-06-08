import { AppLayout } from "@/layout/AppLayout";
import { OrganizationShell } from "@/features/tenant/components/OrganizationShell";

export function OrganizationPage() {
  return (
    <AppLayout>
      <OrganizationShell />
    </AppLayout>
  );
}
