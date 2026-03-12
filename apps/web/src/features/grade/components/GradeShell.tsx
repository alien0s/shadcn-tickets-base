import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/sidebar-context";
import { TeacherProfilePanel } from "@/features/teachers";
import { type ShiftKey } from "../types";
import { GradeGrid } from "./GradeGrid";
import { type ToolbarOption, GradeToolbar } from "./GradeToolbar";
import { useGradeWheelShift } from "../hooks/useGradeWheelShift";
import { useGradeDirectory } from "../hooks/useGradeDirectory";
import { useGradeScheduleData } from "../hooks/useGradeScheduleData";

export function GradeShell() {
  const { toggleSidebar } = useSidebar();
  const [shift, setShift] = useState<ShiftKey>("M");
  const [headerView, setHeaderView] = useState<"professor" | "turma">("professor");
  const [escola, setEscola] = useState<string>("");
  const [professor, setProfessor] = useState<string>("");
  const [isProfessorPanelOpen, setIsProfessorPanelOpen] = useState(false);
  const { schools, teachers, isLoadingSchools, isLoadingTeachers } = useGradeDirectory(escola || null);
  const {
    events,
    timesByShift,
    hasConfiguredTimeSlots,
    turmaOptions,
    subjectOptions,
    teacherStats,
    isLoadingSchedules,
    persistScheduleMove,
    createScheduleFromSelection,
    deleteScheduleById,
    checkClassConflictAtSelection,
  } = useGradeScheduleData(
    escola || null,
    professor || null
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

  const { handleWheelShift } = useGradeWheelShift({
    shift,
    onShiftChange: setShift,
  });

  const handleSchoolChange = useCallback((schoolId: string) => {
    setEscola(schoolId);
    setProfessor("");
  }, []);

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
                  shift={shift}
                  escola={escola}
                  professor={professor}
                  onShiftChange={setShift}
                  onEscolaChange={handleSchoolChange}
                  onProfessorChange={setProfessor}
                  escolaOptions={escolaOptions}
                  professorOptions={professorOptions}
                  isLoadingSchools={isLoadingSchools}
                  isLoadingTeachers={isLoadingTeachers}
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
                    turmaOptions={turmaOptions}
                    subjectOptions={subjectOptions}
                    selectedTeacherSubjectOptions={selectedTeacherSubjectNames}
                    timesByShift={timesByShift}
                    isSchoolScheduleConfigured={hasConfiguredTimeSlots}
                    onPersistMove={persistScheduleMove}
                    onCreateSchedule={createScheduleFromSelection}
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
