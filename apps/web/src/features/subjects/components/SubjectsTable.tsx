import { useMemo, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLucideIconByName } from "@/utils/subject-icons";

type SubjectRow = {
  id: string;
  name: string;
  icon?: string | null;
  created_at: string;
};

type SubjectsTableProps = {
  subjects: SubjectRow[];
  isLoading: boolean;
  error: string | null;
  onUpdateSubject: (subjectId: string, payload: { name: string; icon: string }) => Promise<void>;
};

type DraftState = {
  id: string;
  name: string;
  icon: string;
};

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
          <TableCell><Skeleton className="h-9 w-40" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-9 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SubjectsTable({
  subjects,
  isLoading,
  error,
  onUpdateSubject,
}: SubjectsTableProps) {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const previewIcon = useMemo(() => {
    if (!draft) return null;
    return getLucideIconByName(draft.icon);
  }, [draft]);

  const startEditing = (subject: SubjectRow) => {
    setDraft({
      id: subject.id,
      name: subject.name,
      icon: subject.icon ?? "",
    });
  };

  const cancelEditing = () => {
    if (isSaving) return;
    setDraft(null);
  };

  const saveEditing = async () => {
    if (!draft) return;

    setIsSaving(true);
    try {
      await onUpdateSubject(draft.id, {
        name: draft.name,
        icon: draft.icon,
      });
      toast.success("Matéria atualizada com sucesso.");
      setDraft(null);
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Não foi possível atualizar a matéria.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Ícone</TableHead>
            <TableHead>Matéria</TableHead>
            <TableHead className="w-[260px]">Nome do ícone Lucide</TableHead>
            <TableHead className="w-[140px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingRows />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                {error}
              </TableCell>
            </TableRow>
          ) : subjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                Nenhuma matéria encontrada.
              </TableCell>
            </TableRow>
          ) : (
            subjects.map((subject) => {
              const isEditing = draft?.id === subject.id;
              const Icon = isEditing
                ? previewIcon
                : getLucideIconByName(subject.icon);

              return (
                <TableRow key={subject.id}>
                  <TableCell className="py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40">
                      {Icon ? <Icon className="h-5 w-5 text-foreground" /> : null}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    {isEditing ? (
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, name: event.target.value } : current))
                        }
                        placeholder="Nome da matéria"
                        disabled={isSaving}
                      />
                    ) : (
                      <span className="font-medium text-foreground">{subject.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    {isEditing ? (
                      <Input
                        value={draft.icon}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, icon: event.target.value } : current))
                        }
                        placeholder="Ex: BookOpenText"
                        disabled={isSaving}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{subject.icon || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button type="button" size="sm" onClick={() => void saveEditing()} disabled={isSaving}>
                          <Save className="h-4 w-4" />
                          Salvar
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={() => startEditing(subject)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
