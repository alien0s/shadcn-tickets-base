import { memo, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SchoolsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateSchool: () => void;
};

function SchoolsToolbarComponent({ search, onSearchChange, onCreateSchool }: SchoolsToolbarProps) {
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className="flex flex-1 items-center justify-end gap-2">
      <div className="relative w-full max-w-[320px]">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </span>
        <Input
          placeholder="Pesquisar escola"
          className="h-9 pl-8"
          value={search}
          onChange={handleSearchChange}
        />
      </div>
      <Button size="sm" className="gap-2" onClick={onCreateSchool}>
        <Plus className="h-4 w-4" />
        Criar escola
      </Button>
    </div>
  );
}

export const SchoolsToolbar = memo(SchoolsToolbarComponent);
