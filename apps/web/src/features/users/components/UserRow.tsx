import { useCallback, useState, memo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UserRecord } from "../data/mockUsers";
import { getInitials } from "../utils/getInitials";
import { EditUserDialog } from "./EditUserDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

type UserRowProps = {
  user: UserRecord;
  onDeleted?: (userId: string) => void;
  onUpdated?: (userId: string, data: { name?: string; last_name?: string; email?: string; entity_id?: string; department_id?: string; role_id?: string; is_active?: boolean }) => void;
  isCurrentUser?: boolean;
  isAdmin?: boolean;
};

function UserRowComponent({ user, onDeleted, onUpdated, isCurrentUser = false, isAdmin = false }: UserRowProps) {
  // Controla abertura do dialog de edição
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Controla estado de loading durante exclusão
  const [isDeleting, setIsDeleting] = useState(false);
  const isActive = user.is_active ?? false;

  /**
   * Abre o modal de edição
   */
  const handleOpenEdit = useCallback(() => {
    setIsEditOpen(true);
  }, []);

  /**
   * Fecha o modal de edição
   */
  const handleCloseEdit = useCallback((open: boolean) => {
    setIsEditOpen(open);
  }, []);

  /**
   * Handler para excluir usuário
   * Implementa atualização otimista - remove da lista imediatamente
   * sem recarregar a página toda (estilo Microsoft)
   */
  const handleDelete = useCallback(async () => {
    if (isDeleting) return;

    // Segurança adicional: não permite excluir próprio usuário
    if (isCurrentUser) {
      toast.error("Você não pode excluir sua própria conta");
      return;
    }

    setIsDeleting(true);
    try {
      // Chama API para deletar no backend
      await api.delete(`/users/${user.id}`);

      // Sucesso: atualiza UI localmente (sem reload)
      toast.success("Usuário excluído com sucesso");
      onDeleted?.(user.id); // ← Deve chamar removeUser(userId), não refresh()

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao excluir usuário";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, onDeleted, user.id, isCurrentUser]);

  /**
   * Handler chamado após edição bem-sucedida
   * Atualiza a lista localmente sem reload completo
   */
  const handleUserUpdated = useCallback((data: { name?: string; last_name?: string; email?: string; entity_id?: string; department_id?: string; role_id?: string; is_active?: boolean }) => {
    onUpdated?.(user.id, data);
  }, [onUpdated, user.id]);

  return (
    <tr className="border-b border-border last:border-b-0">
      {/* Coluna de avatar e nome (sticky para scroll horizontal) */}
      <td className="px-3 py-3 sticky left-0 z-10 bg-background">
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={handleOpenEdit}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-muted/70">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{user.name}</span>
          </div>
        </button>
      </td>

      {/* Coluna de email */}
      <td className="px-3 py-3 text-muted-foreground truncate">
        {user.email}
      </td>

      {/* Coluna de função/cargo */}
      <td className="px-3 py-3 text-muted-foreground">{user.role}</td>

      {/* Coluna de entidade */}
      <td className="px-3 py-3 text-muted-foreground">{user.entity}</td>
      {/* Coluna de status ativo */}
      <td className="px-3 py-3">
        <span
          role="img"
          aria-label={isActive ? "Usuario ativo" : "Usuario inativo"}
          className={[
            "inline-flex h-2.5 w-2.5 rounded-full",
            isActive ? "bg-emerald-500" : "bg-red-500",
          ].join(" ")}
        />
      </td>

      {/* Coluna de ações (editar e excluir) */}
      <td className="px-3 py-3">
        <div className="flex justify-start gap-2 whitespace-nowrap">
          {/* Botão de editar */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleOpenEdit}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>

          {/* Botão de excluir - OCULTO se for o próprio usuário */}
          {!isCurrentUser && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 hover:text-red-700"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Tem certeza que deseja excluir usuário?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acao nao pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                  >
                    Excluir usuário
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Modal de edição de usuário */}
          <EditUserDialog
            user={user}
            open={isEditOpen}
            onOpenChange={handleCloseEdit}
            onUpdated={handleUserUpdated}
            isAdmin={isAdmin}
          />
        </div>
      </td>
    </tr>
  );
}

// Memoiza o componente para evitar re-renders desnecessários
// Quando a lista de usuários for grande, isso melhora performance significativamente
export const UserRow = memo(UserRowComponent);

type UserRowSkeletonProps = {
  rows?: number;
};

function UserRowSkeletonComponent({ rows = 15 }: UserRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={`user-row-skeleton-${index}`} className="border-b border-border last:border-b-0">
          {/* Skeleton da coluna de avatar e nome */}
          <td className="px-3 py-3 sticky left-0 z-10 bg-background">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>

          {/* Skeleton da coluna de email */}
          <td className="px-3 py-3">
            <Skeleton className="h-3 w-40" />
          </td>

          {/* Skeleton da coluna de função */}
          <td className="px-3 py-3">
            <Skeleton className="h-3 w-24" />
          </td>

          {/* Skeleton da coluna de entidade */}
          <td className="px-3 py-3">
            <Skeleton className="h-3 w-24" />
          </td>

          {/* Skeleton da coluna de status */}
          <td className="px-3 py-3">
            <Skeleton className="h-3 w-3 rounded-full" />
          </td>

          {/* Skeleton da coluna de ações */}
          <td className="px-3 py-3">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// Memoiza o skeleton para evitar re-renders desnecessários
export const UserRowSkeleton = memo(UserRowSkeletonComponent);





