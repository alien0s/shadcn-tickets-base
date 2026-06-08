import { AlertTriangle, CheckCircle2, Clock, Presentation, XCircle, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSubjectColorClasses } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";
import { getLucideIconByName } from "@/utils/subject-icons";

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
  subjectProgress?: Array<{
    subjectName: string;
    seriesName: string;
    currentCount: number;
    targetCount: number;
  }>;
  subjectIconsByName?: Record<string, string | null | undefined>;
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

function MetricCard({
  label,
  value,
  isLoading,
  icon: Icon,
}: {
  label: string;
  value: string;
  isLoading?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
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

function getProgressStatusMessage(currentCount: number, targetCount: number): string {
  if (targetCount === 0) {
    return "Sem matriz configurada";
  }

  if (currentCount === targetCount) {
    return "Matriz alinhada";
  }

  if (currentCount > targetCount) {
    return "O número de aulas excede as aulas da matriz";
  }

  return `Ainda faltam ${Math.max(targetCount - currentCount, 0)} para a matriz`;
}

function ProgressStatusIcon({ currentCount, targetCount }: { currentCount: number; targetCount: number }) {
  const message = getProgressStatusMessage(currentCount, targetCount);

  const icon =
    currentCount === targetCount ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
    ) : currentCount > targetCount ? (
      <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{icon}</span>
      </TooltipTrigger>
      <TooltipContent className="border-black bg-black text-white">
        {message}
      </TooltipContent>
    </Tooltip>
  );
}

function SubjectProgressRow({
  subjectName,
  seriesName,
  currentCount,
  targetCount,
  iconName,
}: {
  subjectName: string;
  seriesName: string;
  currentCount: number;
  targetCount: number;
  iconName?: string | null;
}) {
  const progress = targetCount > 0 ? Math.min(currentCount / targetCount, 1) : currentCount > 0 ? 1 : 0;
  const SubjectIcon = getLucideIconByName(iconName);

  return (
    <div className="rounded-md border border-border bg-muted/10 p-2.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {SubjectIcon ? <SubjectIcon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
            <span className="truncate">{subjectName}</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">{seriesName}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <ProgressStatusIcon currentCount={currentCount} targetCount={targetCount} />
          <span>{currentCount}/{targetCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
          {currentCount}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-foreground">
          {targetCount}
        </span>
      </div>
    </div>
  );
}

export function TeacherProfilePanel({
  teacher,
  lessonsCount,
  totalHours,
  totalMinutes,
  classNames,
  subjectNames = [],
  subjectProgress = [],
  subjectIconsByName,
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
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Aulas" value="0" isLoading icon={Presentation} />
            <MetricCard label="Horas" value="0h" isLoading icon={Clock} />
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

          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Aulas" value={String(lessonsCount)} isLoading={isLoadingStats} icon={Presentation} />
            <MetricCard label={workloadMetricLabel} value={workloadLabel} isLoading={isLoadingStats} icon={Clock} />
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
            ) : subjectProgress.length > 0 ? (
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {subjectProgress.map((item) => (
                  <SubjectProgressRow
                    key={`${item.subjectName}-${item.seriesName}`}
                    subjectName={item.subjectName}
                    seriesName={item.seriesName}
                    currentCount={item.currentCount}
                    targetCount={item.targetCount}
                    iconName={subjectIconsByName?.[item.subjectName]}
                  />
                ))}
              </div>
            ) : subjectNames.length === 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">Sem disciplinas atribuídas.</div>
            ) : (
              <div className="mt-2 flex max-h-72 flex-wrap gap-1.5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

