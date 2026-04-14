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

type SchoolGradeImportOverwriteDialogProps = {
  open: boolean;
  isImportingGrade: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SchoolGradeImportOverwriteDialog({
  open,
  isImportingGrade,
  onOpenChange,
  onConfirm,
}: SchoolGradeImportOverwriteDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isImportingGrade) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className={isImportingGrade ? "cursor-not-allowed" : undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>Sobrescrever grade atual?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja sobrescrever a grade dessa escola? A grade atual sera excluida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isImportingGrade}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isImportingGrade}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isImportingGrade ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              "Confirmar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type SchoolGradeDeleteDialogProps = {
  open: boolean;
  isDeletingGrade: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SchoolGradeDeleteDialog({
  open,
  isDeletingGrade,
  onOpenChange,
  onConfirm,
}: SchoolGradeDeleteDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isDeletingGrade) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className={isDeletingGrade ? "cursor-not-allowed" : undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa acao vai excluir a grade completa da escola, incluindo horarios e aulas vinculadas.
            Ela nao pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingGrade}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeletingGrade}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeletingGrade ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir grade"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
