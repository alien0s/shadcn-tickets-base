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

type UserRowProps = {
  user: UserRecord;
};

function UserRowComponent({ user }: UserRowProps) {
  // Controla abertura do dialog de edição
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Abre o modal de edição
  const handleOpenEdit = useCallback(() => {
    setIsEditOpen(true);
  }, []);

  // Fecha o modal de edição
  const handleCloseEdit = useCallback((open: boolean) => {
    setIsEditOpen(open);
  }, []);

  // Handler para excluir usuário (preparado para API futura)
  const handleDelete = useCallback(() => {
    // TODO: Integrar com API - DELETE /api/users/:id
    // Exemplo:
    // try {
    //   await deleteUser(user.id);
    //   toast.success(`Usuario ${user.name} excluido`);
    // } catch (error) {
    //   toast.error("Erro ao excluir usuário");
    // }
    
    // Por enquanto, apenas mostra toast de sucesso
    toast.success(`Usuario ${user.name} excluido`);
  }, [user.id, user.name]);

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

          {/* Dialog de confirmação de exclusão */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
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

          {/* Modal de edição de usuário */}
          <EditUserDialog
            user={user}
            open={isEditOpen}
            onOpenChange={handleCloseEdit}
          />
        </div>
      </td>
    </tr>
  );
}

// Memoiza o componente para evitar re-renders desnecessários
// Quando a lista de usuários for grande, isso melhora performance significativamente
export const UserRow = memo(UserRowComponent);