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
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import type { UserRecord } from "../data/mockUsers";
import { getInitials } from "../utils/getInitials";
import { EditUserDialog } from "./EditUserDialog";

type UserRowProps = {
  user: UserRecord;
};

export function UserRow({ user }: UserRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-3 py-3 sticky left-0 z-10 bg-background">
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={() => setIsEditOpen(true)}
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
      <td className="px-3 py-3 text-muted-foreground truncate">
        {user.email}
      </td>
      <td className="px-3 py-3 text-muted-foreground">{user.role}</td>
      <td className="px-3 py-3 text-muted-foreground">{user.entity}</td>
      <td className="px-3 py-3">
        <div className="flex justify-start gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 hover:text-red-700"
              >
                <Trash className="h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Tem certeza que deseja excluir usuario?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acao nao pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => toast.success(`Usuario ${user.name} excluido`)}
                >
                  Excluir usuario
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <EditUserDialog
            user={user}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
        </div>
      </td>
    </tr>
  );
}
