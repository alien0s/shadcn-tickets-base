import { useState } from "react";
import { useSubjects } from "./hooks/useSubjects";
import { SubjectsHeader } from "./components/SubjectsHeader";
import { SubjectsTable } from "./components/SubjectsTable";
import { SubjectsToolbar } from "./components/SubjectsToolbar";
import { SubjectsCreateDialog } from "./components/SubjectsCreateDialog";

export function Subjects() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { subjects, total, isLoading, error, createSubject, updateSubject } = useSubjects();

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="mx-auto max-w-7xl px-3 pt-3 pb-5 sm:px-5 lg:px-8 h-full flex flex-col">
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between gap-2">
              <SubjectsHeader count={total} />
              <SubjectsToolbar onCreateClick={() => setIsCreateDialogOpen(true)} />
            </div>

            <SubjectsTable
              subjects={subjects}
              isLoading={isLoading}
              error={error}
              onUpdateSubject={updateSubject}
            />

            <SubjectsCreateDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onCreateSubject={createSubject}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
