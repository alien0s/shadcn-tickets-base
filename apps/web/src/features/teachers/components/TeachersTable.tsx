import { memo, useCallback, useState } from "react";
import { ChevronDown, Pencil, Trash2, X } from "lucide-react";
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

export type TeacherRow = {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  schoolName: string;
  avatarUrl?: string | null;
  active: boolean;
  subjects?: Array<{ id: string; name: string }>;
};

type TeachersTableProps = {
  teachers: TeacherRow[];
  selectedSchoolId: string;
  schoolOptions: Array<{ id: string; name: string }>;
  onSchoolChange: (value: string) => void;
  selectedTeacherId?: string | null;
  onSelectTeacher?: (teacherId: string) => void;
  onEditTeacher?: (teacher: TeacherRow) => void;
  onDeleteTeacher?: (teacher: TeacherRow) => Promise<boolean>;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
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

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
          : "border-slate-300 bg-slate-100 text-slate-700"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
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

function TeachersTableComponent({
  teachers,
  selectedSchoolId,
  schoolOptions,
  onSchoolChange,
  selectedTeacherId,
  onSelectTeacher,
  onEditTeacher,
  onDeleteTeacher,
  page,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
  error,
}: TeachersTableProps) {
  const hasData = teachers.length > 0;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteTeacher, setPendingDeleteTeacher] = useState<TeacherRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = useCallback((teacher: TeacherRow) => {
    setPendingDeleteTeacher(teacher);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteTeacher || !onDeleteTeacher || isDeleting) return;
    setIsDeleting(true);
    const deleted = await onDeleteTeacher(pendingDeleteTeacher);
    setIsDeleting(false);
    if (deleted) {
      setIsDeleteDialogOpen(false);
      setPendingDeleteTeacher(null);
    }
  }, [isDeleting, onDeleteTeacher, pendingDeleteTeacher]);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      {isLoading ? (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full table-fixed text-sm [&_th:first-child]:pl-4 [&_td:first-child]:pl-4">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[22%]" />
                <col className="w-[26%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead className="sticky top-0 z-30 bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold">Professor</th>
                  <th className="px-3 py-3 text-left font-semibold">Email</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    <SchoolColumnFilter
                      selectedSchoolId={selectedSchoolId}
                      schoolOptions={schoolOptions}
                      onSchoolChange={onSchoolChange}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Status</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }).map((_, index) => (
                  <tr key={index} className="h-16 border-b border-border/60">
                    <td className="px-3 py-4"><Skeleton className="h-9 w-48" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-5 w-52" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-5 w-44" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-8 w-16" /></td>
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
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <div className="w-full max-w-xs text-muted-foreground">
            <NotFoundUFO />
          </div>
          <div className="text-sm text-muted-foreground">Nenhum professor encontrado.</div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full table-fixed text-sm [&_th:first-child]:pl-4 [&_td:first-child]:pl-4">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[22%]" />
                <col className="w-[26%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead className="sticky top-0 z-30 bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold">Professor</th>
                  <th className="px-3 py-3 text-left font-semibold">Email</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    <SchoolColumnFilter
                      selectedSchoolId={selectedSchoolId}
                      schoolOptions={schoolOptions}
                      onSchoolChange={onSchoolChange}
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Status</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((item) => (
                  <tr
                    key={item.id}
                    className={`h-16 border-b border-border/60 cursor-pointer transition-colors ${selectedTeacherId === item.id ? "bg-accent/40" : "hover:bg-muted/40"}`}
                    onClick={() => onSelectTeacher?.(item.id)}
                  >
                    <td className="px-3 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9 rounded-md">
                          <AvatarImage src={item.avatarUrl ?? undefined} alt={item.name} />
                          <AvatarFallback className="rounded-md text-[10px]">{getInitials(item.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-middle text-muted-foreground truncate">{item.email || "-"}</td>
                    <td className="px-3 py-4 align-middle truncate">{item.schoolName}</td>
                    <td className="px-3 py-4 align-middle">
                      <StatusPill active={item.active} />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex items-center justify-start gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label={`Editar ${item.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTeacher?.(item);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label={`Excluir ${item.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openDeleteDialog(item);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
            setPendingDeleteTeacher(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação vai excluir o professor e não pode ser desfeita.
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
              {isDeleting ? "Excluindo..." : "Excluir professor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const TeachersTable = memo(TeachersTableComponent);
