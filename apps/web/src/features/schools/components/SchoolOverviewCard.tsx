import { CalendarRange, GraduationCap, School, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SchoolOverviewCardProps = {
  schoolName: string;
  schoolAbbreviation: string;
  hasSchedule: boolean;
  classCount: number;
  teacherCount: number;
  scheduleCount: number;
  isLoading?: boolean;
};

export function SchoolOverviewCard({
  schoolName,
  schoolAbbreviation,
  hasSchedule,
  classCount,
  teacherCount,
  scheduleCount,
  isLoading = false,
}: SchoolOverviewCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-muted/40">
            <School className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-48 max-w-[60vw]" />
              ) : (
                <h2 className="text-2xl font-bold leading-tight">{schoolName}</h2>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                {isLoading ? <Skeleton className="h-3.5 w-10" /> : schoolAbbreviation}
              </span>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                {hasSchedule ? "Com grade" : "Sem grade"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 md:w-auto">
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              Turmas
            </div>
            {isLoading ? (
              <Skeleton className="mt-1 h-7 w-7 sm:h-8 sm:w-8" />
            ) : (
              <p className="mt-1 text-3xl font-semibold leading-none sm:text-[2rem]">{classCount}</p>
            )}
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              Professores
            </div>
            {isLoading ? (
              <Skeleton className="mt-1 h-7 w-7 sm:h-8 sm:w-8" />
            ) : (
              <p className="mt-1 text-3xl font-semibold leading-none sm:text-[2rem]">{teacherCount}</p>
            )}
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5 shrink-0" />
              Horários
            </div>
            {isLoading ? (
              <Skeleton className="mt-1 h-7 w-7 sm:h-8 sm:w-8" />
            ) : (
              <p className="mt-1 text-3xl font-semibold leading-none sm:text-[2rem]">{scheduleCount}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
