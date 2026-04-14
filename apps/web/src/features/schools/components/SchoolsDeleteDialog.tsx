import { LoaderCircleIcon } from "lucide-react";
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
import type { SchoolCardRow } from "../types";

type SchoolsDeleteDialogProps = {
  open: boolean;
  school: SchoolCardRow | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SchoolsDeleteDialog({
  open,
  school,
  isDeleting,
  onOpenChange,
  onConfirm,
}: SchoolsDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir escola?</AlertDialogTitle>
          <AlertDialogDescription>
            {school
              ? `A escola ${school.abbreviation} será excluída. Essa ação não pode ser desfeita.`
              : "Essa ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              if (isDeleting) return;
              onConfirm();
            }}
          >
            {isDeleting ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir escola"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

