import { memo } from "react";
import { Ellipsis, GraduationCap, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundUFO } from "@/components/illustrations/NotFoundUFO";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { SchoolCardRow } from "../types";

const SCHOOL_CARD_TONES = [
  "from-sky-200/70 to-sky-100/45 dark:from-sky-900/45 dark:to-sky-800/25",
  "from-blue-200/70 to-blue-100/45 dark:from-blue-900/45 dark:to-blue-800/25",
  "from-cyan-200/70 to-cyan-100/45 dark:from-cyan-900/45 dark:to-cyan-800/25",
  "from-slate-200/70 to-slate-100/45 dark:from-slate-800/55 dark:to-slate-700/30",
  "from-emerald-200/70 to-emerald-100/45 dark:from-emerald-900/45 dark:to-emerald-800/25",
  "from-orange-200/70 to-orange-100/45 dark:from-orange-900/45 dark:to-orange-800/25",
] as const;

type SchoolsGridProps = {
  schools: SchoolCardRow[];
  isLoading?: boolean;
  error?: string | null;
  onEditSchool?: (school: SchoolCardRow) => void;
  onDeleteSchool?: (school: SchoolCardRow) => void;
};

function SchoolsGridComponent({
  schools,
  isLoading = false,
  error,
  onEditSchool,
  onDeleteSchool,
}: SchoolsGridProps) {
  if (isLoading) {
    return (
      <div className="grid min-h-0 flex-1 auto-rows-max content-start items-start grid-cols-1 gap-3 overflow-auto pb-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="min-h-[184px] overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className="h-14 w-full rounded-none" />
            <div className="space-y-2 p-2.5">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-40" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8">
        <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-2 text-center text-muted-foreground">
          <NotFoundUFO />
          <span className="text-sm">Nenhuma escola encontrada.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 auto-rows-max content-start items-start grid-cols-1 gap-3 overflow-auto pb-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {schools.map((school, index) => {
        const tone = SCHOOL_CARD_TONES[index % SCHOOL_CARD_TONES.length];
        return (
          <Link
            key={school.id}
            to={`/escolas/${school.id}`}
            className="min-h-[184px] self-start overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <article>
              <div className={cn("h-14 w-full bg-gradient-to-br", tone)} />
              <div className="space-y-2 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-bold leading-none tracking-tight">{school.abbreviation}</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-[-4px] h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Ações da escola ${school.abbreviation}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={(event) => {
                          event.preventDefault();
                          onEditSchool?.(school);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onSelect={(event) => {
                          event.preventDefault();
                          onDeleteSchool?.(school);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="line-clamp-2 min-h-[2.4rem] text-sm text-muted-foreground">{school.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/70 bg-muted/40 p-2">
                    <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      Turmas
                    </div>
                    <p className="mt-1 text-lg font-semibold leading-none">{school.classCount}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/40 p-2">
                    <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      Professores
                    </div>
                    <p className="mt-1 text-lg font-semibold leading-none">{school.teacherCount}</p>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}

export const SchoolsGrid = memo(SchoolsGridComponent);
