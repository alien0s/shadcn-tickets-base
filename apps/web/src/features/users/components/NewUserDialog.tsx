import { useCallback, useEffect, useState } from "react";
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
import { api } from "@/lib/api";
import { useDepartments } from "@/hooks/useDepartments";
import { useEntities } from "@/hooks/useEntities";

type CreatedUser = {
  id: string;
  name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  department_id: string;
  role_id: string;
  entity_id: string;
  created_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (user: CreatedUser) => void;
};

// Opções de permissão com ícones (constante fora do componente)
const PERMISSION_OPTIONS = [
  { key: "admin", label: "Admin", icon: ShieldCheck },
  { key: "agent", label: "Agente", icon: Headset },
  { key: "user", label: "Usuario", icon: User },
] as const;

type PermissionKey = (typeof PERMISSION_OPTIONS)[number]["key"];

const ROLE_ID_BY_PERMISSION: Record<PermissionKey, string> = {
  admin: "650e8400-e29b-41d4-a716-446655440000",
  agent: "650e8400-e29b-41d4-a716-446655440001",
  user: "650e8400-e29b-41d4-a716-446655440002",
};

export function NewUserDialog({ open, onOpenChange, onCreated }: Props) {
  // Estados do formulário
  const [departmentId, setDepartmentId] = useState<string>("");
  const [entityId, setEntityId] = useState<string>("");
  const [permission, setPermission] = useState<PermissionKey>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados da API
  const { departments, isLoading: isLoadingDepartments } = useDepartments();
  const { entities, isLoading: isLoadingEntities } = useEntities();
  
  // Controla auto-focus do dialog (desabilitado em mobile)
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  // Detecta se é mobile para desabilitar auto-focus
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateAutoFocus = () => setShouldAutoFocus(!mediaQuery.matches);
    
    // Define valor inicial
    updateAutoFocus();

    // Atualiza quando o tamanho da tela muda
    mediaQuery.addEventListener("change", updateAutoFocus);

    return () => {
      mediaQuery.removeEventListener("change", updateAutoFocus);
    };
  }, []);

  useEffect(() => {
    if (departments.length > 0) {
      setDepartmentId((current) => current || departments[0].id);
    }
  }, [departments]);

  useEffect(() => {
    if (entities.length > 0) {
      setEntityId((current) => current || entities[0].id);
    }
  }, [entities]);

  // Handler para fechar o dialog
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Handler para submit do formulário
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) return;

      const form = event.currentTarget;
      const formData = new FormData(form);
      const name = String(formData.get("firstName") || "").trim();
      const lastName = String(formData.get("lastName") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const roleId = ROLE_ID_BY_PERMISSION[permission];

      setIsSubmitting(true);

      try {
        const { data, message } = await api.postWithMeta<CreatedUser>("/users", {
          name,
          last_name: lastName,
          email,
          department_id: departmentId,
          role_id: roleId,
          entity_id: entityId,
        });

        toast.success(message || "Usuario criado com sucesso");
        form.reset();
        onOpenChange(false);
        if (data) onCreated?.(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao criar usuario";
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [departmentId, entityId, isSubmitting, onOpenChange, permission]
  );

  // Handler para selecionar permissão
  const handlePermissionSelect = useCallback((key: PermissionKey) => {
    setPermission(key);
  }, []);

  const selectedDepartmentName =
    departments.find((item) => item.id === departmentId)?.name ||
    (isLoadingDepartments ? "Carregando..." : "Selecione um departamento");

  const selectedEntityName =
    entities.find((item) => item.id === entityId)?.name ||
    (isLoadingEntities ? "Carregando..." : "Selecione uma entidade");

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
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto sm:overflow-visible"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4 pr-1 pl-1 flex-1 min-h-0">
            {/* Campo de nome */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="firstName" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Digite o nome"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Sobrenome
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Digite o sobrenome"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            {/* Campo de email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nome@empresa.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Seleção de função/cargo */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Departamento</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-9"
                    disabled={isLoadingDepartments || departments.length === 0}
                  >
                    <span>{selectedDepartmentName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {departments.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {isLoadingDepartments
                        ? "Carregando departamentos..."
                        : "Nenhum departamento encontrado"}
                    </div>
                  ) : (
                    <DropdownMenuRadioGroup
                      value={departmentId}
                      onValueChange={setDepartmentId}
                    >
                      {departments.map((option) => (
                        <DropdownMenuRadioItem key={option.id} value={option.id}>
                          {option.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Seleção de permissões (botões visuais) */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Permissão</label>
              <div className="grid grid-cols-3 gap-2">
                {PERMISSION_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = permission === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handlePermissionSelect(option.key)}
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

            {/* Seleção de entidade */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Entidade</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-9"
                    disabled={isLoadingEntities || entities.length === 0}
                  >
                    <span>{selectedEntityName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {entities.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {isLoadingEntities
                        ? "Carregando entidades..."
                        : "Nenhuma entidade encontrada"}
                    </div>
                  ) : (
                    <DropdownMenuRadioGroup
                      value={entityId}
                      onValueChange={setEntityId}
                    >
                      {entities.map((option) => (
                        <DropdownMenuRadioItem key={option.id} value={option.id}>
                          {option.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Footer com botões de ação */}
          <DialogFooter className="sticky bottom-0 left-0 right-0 flex-row w-full gap-2 bg-background pt-4 pb-[calc(0.5rem+var(--safe-bottom, env(safe-area-inset-bottom)))] sm:justify-end sm:space-x-0 sm:pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                isSubmitting || isLoadingDepartments || isLoadingEntities
              }
            >
              {isSubmitting ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
