import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ShieldCheck, Headset, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ROLE_OPTIONS = [
  "Atendimento",
  "Financeiro",
  "Operacoes",
  "Comercial",
  "Suporte",
];

const ENTITY_OPTIONS = ["ANRA", "ACeAm", "Asur", "MLA", "UNoB"];

const PERMISSION_OPTIONS = [
  { key: "admin", label: "Admin", icon: ShieldCheck },
  { key: "agent", label: "Agente", icon: Headset },
  { key: "user", label: "Usuario", icon: User },
] as const;

type PermissionKey = (typeof PERMISSION_OPTIONS)[number]["key"];

export function NewUserDialog({ open, onOpenChange }: Props) {
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [entity, setEntity] = useState(ENTITY_OPTIONS[0]);
  const [permission, setPermission] = useState<PermissionKey>("admin");
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateAutoFocus = () => setShouldAutoFocus(!mediaQuery.matches);
    updateAutoFocus();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateAutoFocus);
    } else {
      mediaQuery.addListener(updateAutoFocus);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateAutoFocus);
      } else {
        mediaQuery.removeListener(updateAutoFocus);
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col h-[100dvh] max-h-[100dvh] w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 rounded-none overflow-hidden p-4 min-[500px]:w-[95vw] min-[500px]:max-w-[600px] min-[500px]:left-1/2 min-[500px]:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[550px] sm:rounded-lg sm:p-6"
        onOpenAutoFocus={(event) => {
          if (!shouldAutoFocus) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Novo usuario</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto sm:overflow-visible"
          onSubmit={(event) => {
            event.preventDefault();
            console.log("Criando usuario:", {
              role,
              entity,
              permission,
            });
            toast.success("Usuario criado com sucesso");
            onOpenChange(false);
          }}
        >
          <div className="space-y-4 pr-1 pl-1 flex-1 min-h-0">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome de usuario</label>
              <Input placeholder="Digite o nome completo" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="nome@empresa.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Funcao</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-9"
                  >
                    <span>{role}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuRadioGroup
                    value={role}
                    onValueChange={setRole}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {option}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Permissoes</label>
              <div className="grid grid-cols-3 gap-2">
                {PERMISSION_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = permission === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setPermission(option.key)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-all",
                        isSelected
                          ? "bg-muted text-foreground border-border"
                          : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Entidade</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-9"
                  >
                    <span>{entity}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuRadioGroup
                    value={entity}
                    onValueChange={setEntity}
                  >
                    {ENTITY_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {option}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 left-0 right-0 flex-row w-full gap-2 bg-background pt-4 pb-[calc(0.5rem+var(--safe-bottom, env(safe-area-inset-bottom)))] sm:justify-end sm:space-x-0 sm:pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Criar usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
