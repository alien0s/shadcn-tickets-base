import { useEffect, useMemo, useState } from "react";
import { ChevronDown, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type TeacherResponse = {
  id: string;
  school_id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  active: boolean;
  subjects?: Array<{ id: string; name: string }>;
};

type CreateTeacherDialogProps = {
  open: boolean;
  schoolOptions: Array<{ id: string; name: string }>;
  subjectOptions: Array<{ id: string; name: string }>;
  onOpenChange: (open: boolean) => void;
  onCreated: (teacher: TeacherResponse) => void;
};

export function CreateTeacherDialog({
  open,
  schoolOptions,
  subjectOptions,
  onOpenChange,
  onCreated,
}: CreateTeacherDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setSchoolId("");
    setSubjectIds([]);
    setIsSaving(false);
  }, [open]);

  const selectedSubjectsLabel = useMemo(() => {
    if (subjectIds.length === 0) return "Selecionar disciplinas";
    const names = subjectOptions
      .filter((option) => subjectIds.includes(option.id))
      .map((option) => option.name);
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }, [subjectIds, subjectOptions]);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && Boolean(schoolId) && !isSaving;
  }, [isSaving, name, schoolId]);

  const toggleSubject = (subjectId: string) => {
    setSubjectIds((previous) =>
      previous.includes(subjectId)
        ? previous.filter((id) => id !== subjectId)
        : [...previous, subjectId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    try {
      const { data, message } = await api.postWithMeta<TeacherResponse>("/teachers", {
        name: name.trim(),
        email: email.trim() ? email.trim() : undefined,
        school_id: schoolId,
        subject_ids: subjectIds,
      });

      onCreated(data);
      toast.success(message || "Professor criado com sucesso");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar professor";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo professor</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Escola</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span className={cn("truncate", !schoolId && "text-muted-foreground")}>
                    {schoolOptions.find((school) => school.id === schoolId)?.name ?? "Selecionar escola"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {schoolOptions.map((school) => (
                  <DropdownMenuItem key={school.id} onSelect={() => setSchoolId(school.id)}>
                    {school.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Disciplinas</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span className={cn("truncate text-left", subjectIds.length === 0 && "text-muted-foreground")}>
                    {selectedSubjectsLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                {subjectOptions.map((subject) => (
                  <DropdownMenuCheckboxItem
                    key={subject.id}
                    checked={subjectIds.includes(subject.id)}
                    onCheckedChange={() => toggleSubject(subject.id)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {subject.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              <UserPlus className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Criar professor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
