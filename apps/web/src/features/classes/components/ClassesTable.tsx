import { memo, useCallback, useState } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundUFO } from "@/components/illustrations/NotFoundUFO";
import { UsersPagination } from "@/features/users/components/UsersPagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TeacherCell = {
  id: string;
  name: string;
  avatar_url?: string | null;
};

export type ClassRow = {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  year: number;
  schoolName: string;
  educationLevel: string;
  teachers: TeacherCell[];
  scheduleCount: number;
  createdAt: string;
};

type ClassesTableProps = {
  classes: ClassRow[];
  selectedSchoolId: string;
  schoolOptions: Array<{ id: string; name: string }>;
  onSchoolChange: (value: string) => void;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onDeleteClass?: (classItem: ClassRow) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
};

function getInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "PR";
}

function TeachersCell({ teachers }: { teachers: TeacherCell[] }) {
  if (teachers.length === 0) {
    return <span className="text-xs text-muted-foreground">Sem professores</span>;
  }

  return (
    <div className="flex min-w-[240px] flex-wrap items-center gap-2">
      {teachers.map((teacher) => (
        <div key={teacher.id} className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-1.5">
          <Avatar className="h-9 w-9 rounded-md">
            <AvatarImage src={teacher.avatar_url ?? undefined} alt={teacher.name} />
            <AvatarFallback className="rounded-md text-[10px]">{getInitials(teacher.name)}</AvatarFallback>
          </Avatar>
          <span className="max-w-[140px] truncate text-xs">{teacher.name}</span>
        </div>
      ))}
    </div>
  );
}

function normalizeLevel(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getLevelTone(level: string): string {
  const normalized = normalizeLevel(level);

  if (normalized.includes("educacao infantil") || normalized === "ei") {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }

  if (normalized.includes("fundamental i") || normalized === "ef1") {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (normalized.includes("fundamental ii") || normalized === "ef2") {
    return "border-blue-300 bg-blue-200 text-blue-800";
  }

  if (normalized.includes("ensino medio") || normalized === "em") {
    return "border-blue-400 bg-blue-300 text-blue-900";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

function EducationLevelPill({ level }: { level: string }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getLevelTone(level)}`}>
      {level}
    </span>
  );
}

function SchoolColumnFilter({
  selectedSchoolId,
  schoolOptions,
  onSchoolChange,
}: {
  selectedSchoolId: string;
  schoolOptions: Array<{ id: string; name: string }>;
  onSchoolChange: (value: string) => void;
}) {
  const selectedLabel =
    selectedSchoolId === "all"
      ? "Escola"
      : schoolOptions.find((school) => school.id === selectedSchoolId)?.name ?? "Escola";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-sm py-0.5 text-left font-semibold hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/60 focus-visible:ring-offset-0"
          aria-label="Filtrar por escola"
        >
          <span className={cn("max-w-[150px] truncate", selectedSchoolId !== "all" && "text-primary")}>
            {selectedLabel}
          </span>
          {selectedSchoolId !== "all" ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Limpar filtro de escola"
              className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSchoolChange("all");
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                onSchoolChange("all");
              }}
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[220px]" align="start">
        <DropdownMenuItem
          onSelect={() => onSchoolChange("all")}
          className={cn(selectedSchoolId === "all" && "bg-accent/40 text-primary font-medium")}
        >
          Todas as escolas
        </DropdownMenuItem>
        {schoolOptions.map((school) => (
          <DropdownMenuItem
            key={school.id}
            onSelect={() => onSchoolChange(school.id)}
            className={cn(selectedSchoolId === school.id && "bg-accent/40 text-primary font-medium")}
          >
            {school.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ClassesTableComponent({
  classes,
  selectedSchoolId,
  schoolOptions,
  onSchoolChange,
  page,
  total,
  pageSize,
  onPageChange,
  onDeleteClass,
  isLoading = false,
  error,
}: ClassesTableProps) {
  const hasData = classes.length > 0;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteClass, setPendingDeleteClass] = useState<ClassRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = useCallback((classItem: ClassRow) => {
    setPendingDeleteClass(classItem);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteClass || !onDeleteClass || isDeleting) return;
    setIsDeleting(true);
    const deleted = await onDeleteClass(pendingDeleteClass);
    setIsDeleting(false);
    if (deleted) {
      setIsDeleteDialogOpen(false);
      setPendingDeleteClass(null);
    }
  }, [isDeleting, onDeleteClass, pendingDeleteClass]);

  const renderClassName = useCallback((item: ClassRow) => {
    return item.name || "-";
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      {isLoading ? (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full table-auto text-sm [&_th:first-child]:pl-4 [&_td:first-child]:pl-4">
              <thead className="sticky top-0 z-30 bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold">Turma</th>
                  <th className="px-3 py-3 text-left font-semibold">Código</th>
                  <th className="px-3 py-3 text-left font-semibold">Ano</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    <SchoolColumnFilter
                      selectedSchoolId={selectedSchoolId}
                      schoolOptions={schoolOptions}
                      onSchoolChange={onSchoolChange}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Nível</th>
                  <th className="min-w-[260px] px-3 py-3 text-left font-semibold">Professores</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }).map((_, index) => (
                  <tr key={index} className="border-b border-border/60">
                    <td className="px-3 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-5 w-44" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-9 w-56" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Separator />
          <UsersPagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </>
      ) : error ? (
        <div className="flex flex-1 min-h-0 items-center justify-center px-4 py-8 text-sm text-muted-foreground">
          {error}
        </div>
      ) : !hasData ? (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full table-auto text-sm [&_th:first-child]:pl-4 [&_td:first-child]:pl-4">
              <thead className="sticky top-0 z-30 bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold">Turma</th>
                  <th className="px-3 py-3 text-left font-semibold">Código</th>
                  <th className="px-3 py-3 text-left font-semibold">Ano</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    <SchoolColumnFilter
                      selectedSchoolId={selectedSchoolId}
                      schoolOptions={schoolOptions}
                      onSchoolChange={onSchoolChange}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Nível</th>
                  <th className="min-w-[260px] px-3 py-3 text-left font-semibold">Professores</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="px-3 py-10">
                    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-2 text-center text-muted-foreground">
                      <NotFoundUFO />
                      <span className="text-sm">Nenhuma turma encontrada.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Separator />
          <UsersPagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full table-auto text-sm [&_th:first-child]:pl-4 [&_td:first-child]:pl-4">
              <thead className="sticky top-0 z-30 bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold">Turma</th>
                  <th className="px-3 py-3 text-left font-semibold">Código</th>
                  <th className="px-3 py-3 text-left font-semibold">Ano</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    <SchoolColumnFilter
                      selectedSchoolId={selectedSchoolId}
                      schoolOptions={schoolOptions}
                      onSchoolChange={onSchoolChange}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Nível</th>
                  <th className="min-w-[260px] px-3 py-3 text-left font-semibold">Professores</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((item) => (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="px-3 py-4 font-medium">{renderClassName(item)}</td>
                    <td className="px-3 py-4 text-muted-foreground">{item.code}</td>
                    <td className="px-3 py-4 text-muted-foreground">{item.year}</td>
                    <td className="px-3 py-4">{item.schoolName}</td>
                    <td className="px-3 py-4">
                      <EducationLevelPill level={item.educationLevel} />
                    </td>
                    <td className="px-3 py-4">
                      <TeachersCell teachers={item.teachers} />
                    </td>
                    <td className="px-3 py-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Excluir turma ${item.name}`}
                        onClick={() => openDeleteDialog(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Separator />
          <UsersPagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteClass(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação vai excluir a turma e não pode ser desfeita.
              {pendingDeleteClass && pendingDeleteClass.scheduleCount > 0
                ? ` Também serão removidas ${pendingDeleteClass.scheduleCount} aula(s) vinculada(s).`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {isDeleting ? "Excluindo..." : "Excluir turma"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const ClassesTable = memo(ClassesTableComponent);
