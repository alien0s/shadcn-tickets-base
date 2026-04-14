import { LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

type GradeGridDeleteDialogProps = {
  open: boolean;
  isDeletingSchedule: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function GradeGridDeleteDialog({
  open,
  isDeletingSchedule,
  onOpenChange,
  onConfirm,
}: GradeGridDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn(isDeletingSchedule && "cursor-not-allowed")}>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação vai excluir a aula da grade e não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingSchedule}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeletingSchedule}
            onClick={(event) => {
              event.preventDefault();
              if (isDeletingSchedule) return;
              onConfirm();
            }}
          >
            {isDeletingSchedule ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir aula"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
