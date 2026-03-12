import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getSubjectColorClasses } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";

export type TeacherProfileTeacher = {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  avatarUrl?: string | null;
};

type TeacherProfilePanelProps = {
  teacher: TeacherProfileTeacher | null;
  lessonsCount: number;
  totalHours: number;
  totalMinutes?: number;
  classNames: string[];
  subjectNames?: string[];
  isLoadingProfile?: boolean;
  isLoadingStats?: boolean;
  hideEmail?: boolean;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PR";
}

function MetricCard({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      {isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <div className="mt-2 text-2xl font-bold">{value}</div>}
    </div>
  );
}

function formatWorkload(totalHours: number, totalMinutes?: number): string {
  const minutes = typeof totalMinutes === "number" && Number.isFinite(totalMinutes)
    ? Math.max(0, Math.round(totalMinutes))
    : Math.max(0, Math.round(totalHours * 60));

  if (minutes < 60) {
    return String(minutes);
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return String(hours);
  }

  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
}

function getWorkloadLabel(totalHours: number, totalMinutes?: number): string {
  const minutes = typeof totalMinutes === "number" && Number.isFinite(totalMinutes)
    ? Math.max(0, Math.round(totalMinutes))
    : Math.max(0, Math.round(totalHours * 60));

  return minutes < 60 ? "Minutos" : "Horas";
}

export function TeacherProfilePanel({
  teacher,
  lessonsCount,
  totalHours,
  totalMinutes,
  classNames,
  subjectNames = [],
  isLoadingProfile = false,
  isLoadingStats = false,
  hideEmail = false,
}: TeacherProfilePanelProps) {
  const workloadLabel = formatWorkload(totalHours, totalMinutes);
  const workloadMetricLabel = getWorkloadLabel(totalHours, totalMinutes);

  if (!teacher && isLoadingProfile) {
    return (
      <aside className="w-full rounded-lg border border-border bg-background p-4 shadow-sm lg:w-[320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Aulas" value="0" isLoading />
            <MetricCard label="Horas" value="0h" isLoading />
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <Skeleton className="h-3 w-12" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full rounded-lg border border-border bg-background p-4 shadow-sm lg:w-[320px]">
      {teacher ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-md">
              <AvatarImage src={teacher.avatarUrl ?? undefined} alt={teacher.name} />
              <AvatarFallback className="rounded-md text-xs">{getInitials(teacher.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{teacher.name}</div>
              {!hideEmail ? (
                <div className="truncate text-xs text-muted-foreground">{teacher.email || "Sem email"}</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
            Escola
            <div className="mt-1 truncate text-sm font-medium text-foreground">{teacher.schoolName}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Aulas" value={String(lessonsCount)} isLoading={isLoadingStats} />
            <MetricCard label={workloadMetricLabel} value={workloadLabel} isLoading={isLoadingStats} />
          </div>

          <div className="rounded-md border border-border px-3 py-2">
            <div className="text-xs text-muted-foreground">Turmas</div>
            {isLoadingStats ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-24" />
              </div>
            ) : classNames.length === 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">Sem turmas vinculadas.</div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {classNames.map((className) => (
                  <span key={className} className="rounded-md border border-border bg-muted/20 px-2 py-1 text-xs font-medium">
                    {className}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-border px-3 py-2">
            <div className="text-xs text-muted-foreground">Disciplinas</div>
            {isLoadingStats ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-24" />
              </div>
            ) : subjectNames.length === 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">Sem disciplinas atribuídas.</div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subjectNames.map((subjectName) => {
                  const tone = getSubjectColorClasses(subjectName);
                  return (
                    <span
                      key={subjectName}
                      className={cn("rounded-md border px-2 py-1 text-xs font-medium", tone.border, tone.background, tone.text)}
                    >
                      {subjectName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground">
          Selecione um professor na tabela para ver o perfil.
        </div>
      )}
    </aside>
  );
}
