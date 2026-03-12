import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/layout/AppLayout";
import { ClassesCreateDialog, ClassesHeader, ClassesTable, ClassesToolbar, useClasses } from "@/features/classes";

export function ClassesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const {
    search,
    setSearch,
    classes,
    total,
    selectedSchoolId,
    setSelectedSchoolId,
    schoolOptions,
    educationLevelOptions,
    seriesOptions,
    page,
    pageSize,
    setPage,
    isLoading,
    error,
    createClass,
    deleteClass,
  } = useClasses();

  const handleDeleteClass = async (classItem: { id: string; name: string; scheduleCount?: number }) => {
    try {
      await deleteClass(classItem.id);
      const lessonsRemoved = classItem.scheduleCount ?? 0;
      toast.success(
        lessonsRemoved > 0
          ? `Turma removida com sucesso. ${lessonsRemoved} aula(s) excluída(s).`
          : "Turma removida com sucesso."
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir turma.";
      toast.error(message);
      return false;
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-5 sm:px-5 lg:px-8 h-full flex flex-col">
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between gap-2">
                <ClassesHeader count={total} />
                <ClassesToolbar
                  search={search}
                  onSearchChange={setSearch}
                  onCreateClass={() => setIsCreateDialogOpen(true)}
                  isLoading={isLoading}
                />
              </div>

              <ClassesTable
                classes={classes}
                selectedSchoolId={selectedSchoolId}
                schoolOptions={schoolOptions}
                onSchoolChange={setSelectedSchoolId}
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onDeleteClass={handleDeleteClass}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>

      <ClassesCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        schoolOptions={schoolOptions}
        educationLevelOptions={educationLevelOptions}
        seriesOptions={seriesOptions}
        defaultSchoolId={selectedSchoolId !== "all" ? selectedSchoolId : undefined}
        onSubmit={createClass}
      />
    </AppLayout>
  );
}
