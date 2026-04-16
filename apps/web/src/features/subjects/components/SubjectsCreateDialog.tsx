import { useMemo, useState } from "react";
import { LoaderCircleIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getLucideIconByName } from "@/utils/subject-icons";

type SubjectsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSubject: (payload: { name: string; icon?: string | null }) => Promise<void>;
};

export function SubjectsCreateDialog({
  open,
  onOpenChange,
  onCreateSubject,
}: SubjectsCreateDialogProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const PreviewIcon = useMemo(() => getLucideIconByName(icon), [icon]);

  const resetForm = () => {
    setName("");
    setIcon("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    const normalizedName = name.trim();
    if (normalizedName.length < 2) {
      toast.warning("Informe um nome de disciplina com pelo menos 2 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      await onCreateSubject({
        name: normalizedName,
        icon: icon.trim() || null,
      });
      toast.success("Disciplina criada com sucesso.");
      resetForm();
      onOpenChange(false);
    } catch (requestError) {
      toast.error(
        requestError instanceof Error ? requestError.message : "Não foi possível criar a disciplina."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar disciplina</DialogTitle>
          <DialogDescription>
            Cadastre uma disciplina e, se quiser, defina o nome do ícone do Lucide.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="subject-name" className="text-sm font-medium text-foreground">
              Nome da disciplina
            </label>
            <Input
              id="subject-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Língua Portuguesa"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject-icon" className="text-sm font-medium text-foreground">
              Nome do ícone Lucide
            </label>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                {PreviewIcon ? <PreviewIcon className="h-5 w-5 text-foreground" /> : null}
              </div>
              <Input
                id="subject-icon"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                placeholder="Ex: BookOpenText"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
            {isSaving ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Criar disciplina
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
