import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubjectsToolbarProps = {
  onCreateClick: () => void;
};

export function SubjectsToolbar({ onCreateClick }: SubjectsToolbarProps) {
  return (
    <Button
      type="button"
      size="sm"
      className="gap-2 sm:px-3"
      onClick={onCreateClick}
      aria-label="Criar disciplina"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Criar disciplina</span>
    </Button>
  );
}
