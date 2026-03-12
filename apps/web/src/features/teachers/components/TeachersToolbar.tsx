import { memo, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TeachersToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateTeacher: () => void;
};

function TeachersToolbarComponent({
  search,
  onSearchChange,
  onCreateTeacher,
}: TeachersToolbarProps) {
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className="flex flex-1 items-center justify-end gap-2">
      <div className="relative w-full max-w-[280px]">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </span>
        <Input
          placeholder="Pesquisar professor"
          className="h-9 pl-8"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <Button size="sm" className="gap-2" onClick={onCreateTeacher}>
        <Plus className="h-4 w-4" />
        Novo professor
      </Button>
    </div>
  );
}

export const TeachersToolbar = memo(TeachersToolbarComponent);
