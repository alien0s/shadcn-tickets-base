import { memo, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClassesToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClass: () => void;
  isLoading?: boolean;
};

function ClassesToolbarComponent({
  search,
  onSearchChange,
  onCreateClass,
  isLoading = false,
}: ClassesToolbarProps) {
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className="flex items-center gap-2 flex-1 justify-end">
      <div className="relative w-full max-w-[280px]">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </span>
        <Input
          placeholder="Pesquisar turma"
          className="pl-8 h-9"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <Button size="sm" className="gap-2" onClick={onCreateClass} disabled={isLoading}>
        <Plus className="h-4 w-4" />
        Criar turma
      </Button>
    </div>
  );
}

export const ClassesToolbar = memo(ClassesToolbarComponent);
