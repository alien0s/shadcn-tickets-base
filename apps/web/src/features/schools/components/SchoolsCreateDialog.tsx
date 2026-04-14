import { useEffect, useId, useMemo, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import type { CreateSchoolInput } from "../types";

type SchoolsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSchool: (input: CreateSchoolInput) => void | Promise<void>;
};

function buildAbbreviation(name: string): string {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 7).toUpperCase();

  return words
    .slice(0, 7)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 7);
}

export function SchoolsCreateDialog({
  open,
  onOpenChange,
  onCreateSchool,
}: SchoolsCreateDialogProps) {
  const activeSwitchId = useId();
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) return;
    setName("");
    setAbbreviation("");
    setActive(true);
    setIsSubmitting(false);
  }, [open]);

  const normalizedAbbreviation = useMemo(
    () => abbreviation.trim().toUpperCase().slice(0, 7),
    [abbreviation]
  );

  const suggestedAbbreviation = useMemo(() => buildAbbreviation(name), [name]);

  const isSubmitDisabled =
    isSubmitting || name.trim().length === 0 || normalizedAbbreviation.length === 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setIsSubmitting(true);

    try {
      await onCreateSchool({
        name: name.trim(),
        abbreviation: normalizedAbbreviation,
        active,
      });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a escola.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none p-4 min-[500px]:left-1/2 min-[500px]:w-[95vw] min-[500px]:max-w-[560px] min-[500px]:-translate-x-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[520px] sm:-translate-y-1/2 sm:rounded-lg sm:p-6"
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Nova escola</DialogTitle>
          <DialogDescription>
            Preencha os dados iniciais para concluir o cadastro da escola.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-1 flex-col gap-4 overflow-y-auto sm:overflow-visible" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-4 pr-1">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome da escola</label>
              <Input
                placeholder="Ex: Escola Estadual João Silva"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">Sigla</label>
                {!normalizedAbbreviation && suggestedAbbreviation ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setAbbreviation(suggestedAbbreviation)}
                    disabled={isSubmitting}
                  >
                    Usar {suggestedAbbreviation}
                  </button>
                ) : null}
              </div>
              <Input
                placeholder="Ex: EEJS"
                value={abbreviation}
                onChange={(event) => setAbbreviation(event.target.value.toUpperCase())}
                maxLength={7}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                Até 7 caracteres. A sigla será usada na listagem e em partes da grade.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <label htmlFor={activeSwitchId} className="text-sm font-medium">
                    Escola ativa
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Escolas inativas podem ficar ocultas nos fluxos principais.
                  </p>
                </div>
                <Switch
                  id={activeSwitchId}
                  checked={active}
                  onCheckedChange={setActive}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 left-0 right-0 w-full flex-row gap-2 bg-background pt-4 sm:justify-end sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? (
                <>
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar escola"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

