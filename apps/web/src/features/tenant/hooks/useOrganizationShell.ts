import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSidebar } from "@/context/sidebar-context";
import { useTenantInfo } from "./useTenantInfo";
import { buildBillingSections, buildProfileSections } from "../utils/organization-view";
import type { EditOrganizationFormValues } from "../components/EditOrganizationDialog";

export function useOrganizationShell() {
  const { toggleSidebar } = useSidebar();
  const { tenantInfo, isLoading, error, updateTenantInfo } = useTenantInfo();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const profileSections = useMemo(() => (tenantInfo ? buildProfileSections(tenantInfo) : []), [tenantInfo]);
  const billingSections = useMemo(() => (tenantInfo ? buildBillingSections(tenantInfo) : []), [tenantInfo]);
  const openEditDialog = useCallback(() => setIsEditDialogOpen(true), []);
  const handleEditDialogOpenChange = useCallback((open: boolean) => setIsEditDialogOpen(open), []);

  const handleEditSubmit = useCallback(
    async (values: EditOrganizationFormValues) => {
      try {
        await updateTenantInfo({
          name: values.name.trim(),
          slug: values.slug.trim().toLowerCase(),
          profile: {
            cnpj: values.cnpj || null,
            phone: values.phone || null,
            email: values.email.trim() || null,
            address: values.address.trim() || null,
            city: values.city.trim() || null,
            state: values.state.trim().toUpperCase() || null,
            zip_code: values.zipCode || null,
          },
          billing: {
            billing_email: values.billingEmail.trim() || null,
            payment_method: values.paymentMethod || null,
          },
        });
        toast.success("Organizacao atualizada com sucesso.");
        setIsEditDialogOpen(false);
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Nao foi possivel atualizar a organizacao.";
        toast.error(message);
        throw requestError;
      }
    },
    [updateTenantInfo]
  );

  return {
    tenantInfo,
    isLoading,
    error,
    profileSections,
    billingSections,
    isEditDialogOpen,
    openEditDialog,
    handleEditDialogOpenChange,
    toggleSidebar,
    handleEditSubmit,
  };
}
