import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, UserPlus } from "lucide-react";

type UsersToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  variant?: "actions" | "search";
};

export function UsersToolbar({
  search,
  onSearchChange,
  variant = "actions",
}: UsersToolbarProps) {
  if (variant === "search") {
    return (
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative w-full">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <Input
            placeholder="Pesquisar usuário"
            className="pl-8 h-9 md:text-sm"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
        <div className="relative w-[200px]">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <Input
            placeholder="Pesquisar usuário"
            className="pl-8 h-9 md:text-sm"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ListFilter className="h-4 w-4" />
          Filtros
        </Button>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Criar usuário
        </Button>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <Button variant="outline" size="icon" className="h-9 w-9">
          <ListFilter className="h-4 w-4" />
        </Button>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Criar usuário
        </Button>
      </div>
    </>
  );
}
