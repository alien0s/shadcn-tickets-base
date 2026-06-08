import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RhTicketPricesTable } from "./RhTicketPricesTable";
import type { RhOption, RhSchoolSection } from "../types/rh.types";

type RhTicketPricesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoadingCatalogs: boolean;
  error: string | null;
  sections: RhSchoolSection[];
  getAvailableOptions: (schoolId: string, rowId: string) => RhOption[];
  onAddRow: (schoolId: string) => void;
  onStartEditingRow: (schoolId: string, rowId: string) => void;
  onUpdateRowOption: (schoolId: string, rowId: string, optionKey: string) => void;
  onUpdateRowPrice: (schoolId: string, rowId: string, value: string) => void;
  onRemoveRow: (schoolId: string, rowId: string) => void;
  onSaveRow: (schoolId: string, rowId: string) => Promise<boolean>;
};

export function RhTicketPricesDialog({
  open,
  onOpenChange,
  isLoadingCatalogs,
  error,
  sections,
  getAvailableOptions,
  onAddRow,
  onStartEditingRow,
  onUpdateRowOption,
  onUpdateRowPrice,
  onRemoveRow,
  onSaveRow,
}: RhTicketPricesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Header, corpo e footer ficam separados para a tabela ocupar o dialog inteiro. */}
      <DialogContent className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none p-0 min-[500px]:left-1/2 min-[500px]:w-[94vw] min-[500px]:max-w-[980px] min-[500px]:-translate-x-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-[94vw] sm:max-w-[980px] sm:-translate-y-1/2 sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
          <DialogTitle>Precos de ticket</DialogTitle>
          <DialogDescription>
            Gerencie os valores por nivel de ensino ou disciplina da escola selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
            <RhTicketPricesTable
              sections={sections}
              isLoading={isLoadingCatalogs}
              error={error}
              getAvailableOptions={getAvailableOptions}
              onAddRow={onAddRow}
              onStartEditingRow={onStartEditingRow}
              onUpdateRowOption={onUpdateRowOption}
              onUpdateRowPrice={onUpdateRowPrice}
              onRemoveRow={onRemoveRow}
              onSaveRow={onSaveRow}
            />
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4 sm:justify-end sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
