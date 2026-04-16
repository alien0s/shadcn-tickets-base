import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/sidebar-context";
import { TeacherProfilePanel } from "@/features/teachers";
import { type ShiftKey, type ToolbarOption } from "../types";
import { GradeGrid } from "./GradeGrid";
import { GradeToolbar } from "./GradeToolbar";
import { useGradeWheelShift } from "../hooks/useGradeWheelShift";
import { useGradeDirectory } from "../hooks/useGradeDirectory";
import { useGradeScheduleData } from "../hooks/useGradeScheduleData";

export function GradeShell() {
  const { toggleSidebar } = useSidebar();
  const [shift, setShift] = useState<ShiftKey>("M");
  const [headerView, setHeaderView] = useState<"professor" | "turma">("professor");
  const [escola, setEscola] = useState<string>("");
  const [professor, setProfessor] = useState<string>("");
  const [turmaId, setTurmaId] = useState<string>("");
  const [isProfessorPanelOpen, setIsProfessorPanelOpen] = useState(false);
  const { schools, teachers, isLoadingSchools, isLoadingTeachers } = useGradeDirectory(escola || null);
  const {
    events,
    timesByShift,
    breakMarkersByShift,
    hasConfiguredTimeSlots,
    classOptions,
    topEditorOptions,
    subjectOptions,
    subjectIconsByName,
    teacherStats,
    isLoadingSchedules,
    persistScheduleMove,
    createScheduleFromSelection,
    updateScheduleFromSelection,
    deleteScheduleById,
    checkClassConflictAtSelection,
  } = useGradeScheduleData(
    escola || null,
    professor || null,
    headerView,
    turmaId || null,
    teachers.map((item) => ({ id: item.id, name: item.name }))
  );

  const escolaOptions = useMemo<readonly ToolbarOption[]>(() => {
    return schools.map((school) => ({
      value: school.id,
      label: school.abbreviation?.trim() ? school.abbreviation.trim().toUpperCase() : school.name,
    }));
  }, [schools]);

  const professorOptions = useMemo<readonly ToolbarOption[]>(() => {
    return teachers.map((teacher) => ({
      value: teacher.id,
      label: teacher.name,
      avatarUrl: teacher.avatar_url ?? undefined,
    }));
  }, [teachers]);

  useEffect(() => {
    if (escolaOptions.length === 0) return;

    const isCurrentValid = escolaOptions.some((option) => option.value === escola);
    if (!isCurrentValid) {
      setEscola(escolaOptions[0].value);
    }
  }, [escola, escolaOptions]);

  useEffect(() => {
    if (professorOptions.length === 0) return;

    const isCurrentValid = professorOptions.some((option) => option.value === professor);
    if (!isCurrentValid) {
      setProfessor(professorOptions[0].value);
    }
  }, [professor, professorOptions]);

  useEffect(() => {
    if (classOptions.length === 0) {
      setTurmaId("");
      return;
    }

    const isCurrentValid = classOptions.some((option) => option.id === turmaId);
    if (!isCurrentValid) {
      setTurmaId(classOptions[0].id);
    }
  }, [classOptions, turmaId]);

  const { handleWheelShift } = useGradeWheelShift({
    shift,
    onShiftChange: setShift,
  });

  const handleSchoolChange = useCallback((schoolId: string) => {
    setEscola(schoolId);
    setProfessor("");
    setTurmaId("");
  }, []);

  const turmaToolbarOptions = useMemo<readonly ToolbarOption[]>(
    () => classOptions.map((item) => ({ value: item.id, label: item.name })),
    [classOptions]
  );

  const selectedSchoolName = useMemo(() => {
    const school = schools.find((item) => item.id === escola);
    return school?.name ?? "-";
  }, [escola, schools]);

  const selectedTeacher = useMemo(() => {
    const teacher = teachers.find((item) => item.id === professor);
    if (!teacher) return null;
    return {
      id: teacher.id,
      name: teacher.name,
      email: "",
      schoolName: selectedSchoolName,
      avatarUrl: teacher.avatar_url ?? undefined,
    };
  }, [professor, selectedSchoolName, teachers]);

  const selectedTeacherSubjectNames = useMemo(() => {
    const teacher = teachers.find((item) => item.id === professor);
    return (teacher?.subjects ?? []).map((subject) => subject.name);
  }, [professor, teachers]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-5 sm:px-5 lg:px-8 h-full flex flex-col">
          <div className="space-y-4 flex flex-col h-full">
            <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  onClick={toggleSidebar}
                  aria-label="Abrir/fechar menu lateral"
                >
                  <PanelRight className="h-4 w-4" aria-hidden="true" />
                </Button>

                <h1 className="text-2xl font-bold leading-tight">Grade</h1>

                <Tabs
                  value={headerView}
                  onValueChange={(value) => setHeaderView(value as "professor" | "turma")}
                  className="hidden md:block"
                >
                  <TabsList className="h-8 rounded-lg bg-muted p-1 w-[180px] opacity-100">
                    <TabsTrigger value="professor" className="h-6 text-xs px-3 rounded-md flex-1">
                      Professor
                    </TabsTrigger>
                    <TabsTrigger value="turma" className="h-6 text-xs px-3 rounded-md flex-1">
                      Turma
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="w-full lg:w-auto">
                <GradeToolbar
                  viewMode={headerView}
                  shift={shift}
                  escola={escola}
                  professor={professor}
                  turmaId={turmaId}
                  onShiftChange={setShift}
                  onEscolaChange={handleSchoolChange}
                  onProfessorChange={setProfessor}
                  onTurmaChange={setTurmaId}
                  escolaOptions={escolaOptions}
                  professorOptions={professorOptions}
                  turmaOptions={turmaToolbarOptions}
                  isLoadingSchools={isLoadingSchools}
                  isLoadingTeachers={isLoadingTeachers}
                  isLoadingTurmas={isLoadingSchedules}
                  isProfessorPanelOpen={isProfessorPanelOpen}
                  onToggleProfessorPanel={() => setIsProfessorPanelOpen((current) => !current)}
                />
              </div>
            </header>

            <section className="flex-1 min-h-0">
              <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap">
                <div
                  className={cn(
                    "min-h-0 min-w-0 flex-1",
                    isProfessorPanelOpen && "hidden lg:block"
                  )}
                  onWheel={handleWheelShift}
                >
                  <GradeGrid
                    shift={shift}
                    events={events.filter((event) => event.shift === shift)}
                    copyScopeKey={
                      headerView === "turma"
                        ? `turma:${escola || "none"}:${turmaId || "none"}`
                        : `professor:${escola || "none"}:${professor || "none"}`
                    }
                    turmaOptions={topEditorOptions}
                    subjectOptions={subjectOptions}
                    subjectIconsByName={subjectIconsByName}
                    selectedTeacherSubjectOptions={selectedTeacherSubjectNames}
                    timesByShift={timesByShift}
                    breakMarkersByShift={breakMarkersByShift}
                    isSchoolScheduleConfigured={hasConfiguredTimeSlots}
                    onPersistMove={persistScheduleMove}
                    onCreateSchedule={createScheduleFromSelection}
                    onUpdateSchedule={updateScheduleFromSelection}
                    onDeleteSchedule={deleteScheduleById}
                    onValidateTurmaSelection={checkClassConflictAtSelection}
                  />
                </div>

                {isProfessorPanelOpen ? (
                  <div className="w-full min-h-0 shrink-0 lg:w-[320px]">
                    <TeacherProfilePanel
                      teacher={selectedTeacher}
                      lessonsCount={teacherStats.lessonsCount}
                      totalHours={teacherStats.totalHours}
                      totalMinutes={teacherStats.totalMinutes}
                      classNames={teacherStats.classNames}
                      subjectNames={selectedTeacherSubjectNames}
                      isLoadingProfile={isLoadingTeachers}
                      isLoadingStats={isLoadingSchedules}
                      hideEmail
                    />
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
