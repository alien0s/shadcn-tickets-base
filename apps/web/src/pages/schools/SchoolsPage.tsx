import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/layout/AppLayout";
import {
  SchoolsCreateDialog,
  SchoolsDeleteDialog,
  SchoolsEditDialog,
  SchoolsGrid,
  SchoolsHeader,
  SchoolsToolbar,
  useSchools,
} from "@/features/schools";
import type { CreateSchoolInput, SchoolCardRow, UpdateSchoolInput } from "@/features/schools";

export function SchoolsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState<SchoolCardRow | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolCardRow | null>(null);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const { search, setSearch, schools, total, isLoading, error, createSchool, deleteSchool, updateSchool } = useSchools();

  const handleCreateSchool = useCallback(async (input: CreateSchoolInput) => {
    const createdSchool = await createSchool(input);
    toast.success(`Escola ${createdSchool.abbreviation ?? input.abbreviation} criada com sucesso.`);
  }, [createSchool]);

  const handleEditSchool = useCallback((school: SchoolCardRow) => {
    setSchoolToEdit(school);
  }, []);

  const handleConfirmEditSchool = useCallback(async (schoolId: string, input: UpdateSchoolInput) => {
    const updatedSchool = await updateSchool(schoolId, input);
    toast.success(`Escola ${updatedSchool.abbreviation ?? input.abbreviation} atualizada com sucesso.`);
  }, [updateSchool]);

  const handleDeleteSchool = useCallback((school: SchoolCardRow) => {
    setSchoolToDelete(school);
  }, []);

  const handleConfirmDeleteSchool = useCallback(async () => {
    if (!schoolToDelete) return;

    setIsDeletingSchool(true);

    try {
      await deleteSchool(schoolToDelete.id);
      toast.success(`Escola ${schoolToDelete.abbreviation} excluída com sucesso.`);
      setSchoolToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir a escola.";
      toast.error(message);
    } finally {
      setIsDeletingSchool(false);
    }
  }, [deleteSchool, schoolToDelete]);

  return (
    <AppLayout>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex h-full max-w-7xl flex-col px-3 pb-5 pt-3 sm:px-5 lg:px-8">
            <div className="flex h-full flex-col space-y-4">
              <div className="flex items-center justify-between gap-2">
                <SchoolsHeader count={total} />
                <SchoolsToolbar
                  search={search}
                  onSearchChange={setSearch}
                  onCreateSchool={() => setIsCreateDialogOpen(true)}
                />
              </div>

              <SchoolsGrid
                schools={schools}
                isLoading={isLoading}
                error={error}
                onEditSchool={handleEditSchool}
                onDeleteSchool={handleDeleteSchool}
              />
            </div>
          </div>
        </div>
      </div>

      <SchoolsCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateSchool={handleCreateSchool}
      />

      <SchoolsEditDialog
        open={Boolean(schoolToEdit)}
        school={schoolToEdit}
        onOpenChange={(open) => {
          if (!open) setSchoolToEdit(null);
        }}
        onEditSchool={handleConfirmEditSchool}
      />

      <SchoolsDeleteDialog
        open={Boolean(schoolToDelete)}
        school={schoolToDelete}
        isDeleting={isDeletingSchool}
        onOpenChange={(open) => {
          if (isDeletingSchool) return;
          if (!open) setSchoolToDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDeleteSchool();
        }}
      />
    </AppLayout>
  );
}
