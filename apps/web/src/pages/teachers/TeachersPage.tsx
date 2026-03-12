import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/layout/AppLayout";
import {
  CreateTeacherDialog,
  EditTeacherDialog,
  TeacherProfilePanel,
  TeachersHeader,
  TeachersTable,
  TeachersToolbar,
  useTeachers,
} from "@/features/teachers";
import { calculateTeacherScheduleStats } from "@/features/teachers/utils/teacherScheduleStats";
import { invalidateGradeDirectoryCache } from "@/features/grade/hooks/useGradeDirectory";
import type { TeacherRow } from "@/features/teachers/components/TeachersTable";

type ScheduleApi = {
  id: string;
  classes?: { name?: string | null } | Array<{ name?: string | null }> | null;
  time_slots?: { start_time?: string | null; end_time?: string | null } | Array<{ start_time?: string | null; end_time?: string | null }> | null;
};

type TeacherApiResponse = {
  id: string;
  school_id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  active: boolean;
  subjects?: Array<{ id: string; name: string }>;
};

const teacherStatsCache = new Map<
  string,
  { lessonsCount: number; totalHours: number; totalMinutes: number; classNames: string[] }
>();

export function TeachersPage() {
  const {
    search,
    setSearch,
    teachers,
    total,
    selectedSchoolId,
    setSelectedSchoolId,
    schoolOptions,
    subjectOptions,
    page,
    pageSize,
    setPage,
    isLoading,
    error,
    updateTeacherInList,
    upsertTeacherInList,
    removeTeacherFromList,
  } = useTeachers();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"table" | "details">("table");
  const [lessonsCount, setLessonsCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    teacherStatsCache.clear();
  }, []);

  const selectedTeacher = useMemo<TeacherRow | null>(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId) ?? null,
    [selectedTeacherId, teachers]
  );

  useEffect(() => {
    if (teachers.length === 0) {
      setSelectedTeacherId(null);
      return;
    }

    const existsInPage = teachers.some((teacher) => teacher.id === selectedTeacherId);
    if (!existsInPage) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (!selectedTeacher) {
      setLessonsCount(0);
      setTotalHours(0);
      setTotalMinutes(0);
      setClassNames([]);
      return;
    }

    const cacheKey = `${selectedTeacher.id}:${selectedTeacher.schoolId}`;
    const cached = teacherStatsCache.get(cacheKey);
    if (cached) {
      setLessonsCount(cached.lessonsCount);
      setTotalHours(cached.totalHours);
      setTotalMinutes(cached.totalMinutes);
      setClassNames(cached.classNames);
      setIsLoadingStats(false);
      return;
    }

    let isCancelled = false;
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const params = new URLSearchParams({
          teacher_id: selectedTeacher.id,
          school_id: selectedTeacher.schoolId,
        });
        const schedules = await api.get<ScheduleApi[]>(`/schedules?${params.toString()}`);
        if (isCancelled) return;

        const snapshot = calculateTeacherScheduleStats(schedules ?? [], {
          defaultLessonMinutes: 60,
        });

        teacherStatsCache.set(cacheKey, snapshot);
        setLessonsCount(snapshot.lessonsCount);
        setTotalHours(snapshot.totalHours);
        setTotalMinutes(snapshot.totalMinutes);
        setClassNames(snapshot.classNames);
      } catch {
        if (isCancelled) return;
        setLessonsCount(0);
        setTotalHours(0);
        setTotalMinutes(0);
        setClassNames([]);
      } finally {
        if (!isCancelled) {
          setIsLoadingStats(false);
        }
      }
    };

    loadStats();
    return () => {
      isCancelled = true;
    };
  }, [selectedTeacher]);

  const handleDeleteTeacher = async (teacher: TeacherRow): Promise<boolean> => {
    try {
      await api.delete<void>(`/teachers/${teacher.id}`);
      removeTeacherFromList(teacher.id);
      invalidateGradeDirectoryCache();
      toast.success("Professor removido com sucesso.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel excluir professor.";
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
                <TeachersHeader count={total} />
                <TeachersToolbar
                  search={search}
                  onSearchChange={setSearch}
                  onCreateTeacher={() => setIsCreateDialogOpen(true)}
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
                <div className={cn("min-h-0 flex-1", mobileView === "details" && "hidden lg:block")}>
                  <TeachersTable
                    teachers={teachers}
                    selectedSchoolId={selectedSchoolId}
                    schoolOptions={schoolOptions}
                    onSchoolChange={setSelectedSchoolId}
                    selectedTeacherId={selectedTeacherId}
                    onSelectTeacher={(teacherId) => {
                      setSelectedTeacherId(teacherId);
                      setMobileView("details");
                    }}
                    onEditTeacher={(teacher) => {
                      setEditingTeacher(teacher);
                      setIsEditDialogOpen(true);
                    }}
                    onDeleteTeacher={handleDeleteTeacher}
                    page={page}
                    total={total}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    isLoading={isLoading}
                    error={error}
                  />
                </div>

                <div className={cn("w-full lg:w-[320px]", mobileView === "table" && "hidden lg:block")}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mb-2 w-full gap-2 lg:hidden"
                    onClick={() => setMobileView("table")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para tabela
                  </Button>
                  <TeacherProfilePanel
                    teacher={selectedTeacher}
                    lessonsCount={lessonsCount}
                    totalHours={totalHours}
                    totalMinutes={totalMinutes}
                    classNames={classNames}
                    subjectNames={(selectedTeacher?.subjects ?? []).map((subject) => subject.name)}
                    isLoadingProfile={isLoading}
                    isLoadingStats={isLoadingStats}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditTeacherDialog
        open={isEditDialogOpen}
        teacher={editingTeacher}
        schoolOptions={schoolOptions}
        subjectOptions={subjectOptions}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingTeacher(null);
        }}
        onUpdated={(updatedTeacher: TeacherApiResponse) => {
          updateTeacherInList({
            id: updatedTeacher.id,
            school_id: updatedTeacher.school_id,
            name: updatedTeacher.name,
            email: updatedTeacher.email ?? "",
            avatar_url: updatedTeacher.avatar_url ?? null,
            active: updatedTeacher.active,
            subjects: updatedTeacher.subjects ?? [],
          });
          invalidateGradeDirectoryCache();
        }}
      />
      <CreateTeacherDialog
        open={isCreateDialogOpen}
        schoolOptions={schoolOptions}
        subjectOptions={subjectOptions}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={(createdTeacher: TeacherApiResponse) => {
          upsertTeacherInList({
            id: createdTeacher.id,
            school_id: createdTeacher.school_id,
            name: createdTeacher.name,
            email: createdTeacher.email ?? "",
            avatar_url: createdTeacher.avatar_url ?? null,
            active: createdTeacher.active,
            subjects: createdTeacher.subjects ?? [],
          });
          invalidateGradeDirectoryCache();
          setSelectedTeacherId(createdTeacher.id);
        }}
      />
    </AppLayout>
  );
}
