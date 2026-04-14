import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/context/sidebar-context";
import { SchoolGradeCreateDialog } from "./SchoolGradeCreateDialog";
import { SchoolGradeDeleteDialog, SchoolGradeImportOverwriteDialog } from "./SchoolGradeConfirmDialogs";
import { SchoolGradeImportDialog } from "./SchoolGradeImportDialog";
import { SchoolGradeSection } from "./SchoolGradeSection";
import { SchoolOverviewCard } from "./SchoolOverviewCard";
import { SchoolProfileHeader } from "./SchoolProfileHeader";
import type { SchoolProfileProps } from "../types";
import { useSchoolProfileController } from "../hooks";

export function SchoolProfile({ schoolId }: SchoolProfileProps) {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const controller = useSchoolProfileController(schoolId);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex h-full max-w-7xl flex-col px-3 pb-6 pt-3 sm:px-5 lg:px-8">
          <div className="space-y-4">
            <SchoolProfileHeader
              breadcrumbSchoolLabel={controller.breadcrumbSchoolLabel}
              onToggleSidebar={toggleSidebar}
            />

            {controller.isLoading ? (
              <div className="space-y-4">
                <SchoolOverviewCard
                  schoolName=""
                  schoolAbbreviation=""
                  hasSchedule={false}
                  classCount={0}
                  teacherCount={0}
                  scheduleCount={0}
                  isLoading
                />
                <Skeleton className="h-80 w-full rounded-xl" />
              </div>
            ) : controller.error ? (
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                {controller.error}
              </div>
            ) : controller.school ? (
              <>
                <SchoolOverviewCard
                  schoolName={controller.school.name}
                  schoolAbbreviation={controller.schoolAbbreviation}
                  hasSchedule={controller.hasSchedule}
                  classCount={controller.classCount}
                  teacherCount={controller.teacherCount}
                  scheduleCount={controller.scheduleTimes.length}
                />

                <div className="flex flex-col gap-4 lg:flex-row">
                  <SchoolGradeSection
                    hasSchedule={controller.hasSchedule}
                    scheduleRows={controller.scheduleRows}
                    onImportGrade={() => controller.handleImportModalOpenChange(true)}
                    onCreateGrade={() => controller.handleCreateModalOpenChange(true)}
                    onEditGrade={() => navigate("/grade")}
                    onDeleteGrade={() => controller.setIsDeleteGradeDialogOpen(true)}
                  />

                  <section className="min-h-[220px] w-full rounded-xl border border-border bg-card p-4 sm:p-5 lg:flex-1">
                    <div className="h-full w-full rounded-lg border border-dashed border-border bg-muted/20" />
                  </section>
                </div>

                <SchoolGradeCreateDialog
                  open={controller.isCreateModalOpen}
                  createStep={controller.createStep}
                  lessonMinutes={controller.lessonMinutes}
                  morningStart={controller.morningStart}
                  morningEnd={controller.morningEnd}
                  afternoonStart={controller.afternoonStart}
                  afternoonEnd={controller.afternoonEnd}
                  breakForms={controller.breakForms}
                  breakValidationMessage={controller.breakValidationMessage}
                  previewRows={controller.previewRows}
                  totalColumns={controller.totalColumns}
                  hasPreviewTimes={controller.hasPreviewTimes}
                  canAdvanceCurrentStep={controller.canAdvanceCurrentStep}
                  isCreatingGrade={controller.isCreatingGrade}
                  createGradePayload={controller.createGradePayload}
                  onOpenChange={controller.handleCreateModalOpenChange}
                  onStepChange={controller.setCreateStep}
                  onLessonMinutesChange={controller.setLessonMinutes}
                  onMorningStartChange={controller.setMorningStart}
                  onMorningEndChange={controller.setMorningEnd}
                  onAfternoonStartChange={controller.setAfternoonStart}
                  onAfternoonEndChange={controller.setAfternoonEnd}
                  onAddBreak={controller.addBreakForm}
                  onUpdateBreak={controller.updateBreakForm}
                  onRemoveBreak={controller.removeBreakForm}
                  onCreateGrade={controller.handleCreateGrade}
                />

                <SchoolGradeImportDialog
                  open={controller.isImportModalOpen}
                  isImportListLoading={controller.isImportListLoading}
                  isImportingGrade={controller.isImportingGrade}
                  importableGrades={controller.importableGrades}
                  selectedImportSchoolId={controller.selectedImportSchoolId}
                  onOpenChange={controller.handleImportModalOpenChange}
                  onSelectGrade={controller.setSelectedImportSchoolId}
                  onImport={controller.handleImportGradeSelection}
                />

                <SchoolGradeImportOverwriteDialog
                  open={controller.isImportOverwriteDialogOpen}
                  isImportingGrade={controller.isImportingGrade}
                  onOpenChange={controller.setIsImportOverwriteDialogOpen}
                  onConfirm={() => {
                    void controller.executeImportGrade(true);
                  }}
                />

                <SchoolGradeDeleteDialog
                  open={controller.isDeleteGradeDialogOpen}
                  isDeletingGrade={controller.isDeletingGrade}
                  onOpenChange={controller.setIsDeleteGradeDialogOpen}
                  onConfirm={() => {
                    void controller.handleDeleteGrade();
                  }}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
