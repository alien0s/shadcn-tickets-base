import { EditOrganizationDialog } from "./EditOrganizationDialog";
import { OrganizationContent } from "./OrganizationContent";
import { OrganizationHeader } from "./OrganizationHeader";
import { useOrganizationShell } from "../hooks/useOrganizationShell";

export function OrganizationShell() {
  const {
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
  } = useOrganizationShell();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-7xl flex-col px-3 pb-5 pt-3 sm:px-5 lg:px-8">
          <div className="flex h-full flex-col space-y-4">
            <OrganizationHeader onToggleSidebar={toggleSidebar} />

            <section className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto min-h-full w-full max-w-5xl">
                <OrganizationContent
                  tenantInfo={tenantInfo}
                  isLoading={isLoading}
                  error={error}
                  profileSections={profileSections}
                  billingSections={billingSections}
                  onEdit={openEditDialog}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {tenantInfo ? (
        <EditOrganizationDialog
          open={isEditDialogOpen}
          tenantInfo={tenantInfo}
          onOpenChange={handleEditDialogOpenChange}
          onSubmit={handleEditSubmit}
        />
      ) : null}
    </div>
  );
}
