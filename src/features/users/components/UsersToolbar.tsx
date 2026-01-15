import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type UsersToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onNewUserClick?: () => void;
  entities: string[];
  roles: string[];
  selectedEntities: string[];
  selectedRoles: string[];
  onToggleEntity: (entity: string) => void;
  onToggleRole: (role: string) => void;
  variant?: "actions" | "search";
};

export function UsersToolbar({
  search,
  onSearchChange,
  onNewUserClick,
  entities,
  roles,
  selectedEntities,
  selectedRoles,
  onToggleEntity,
  onToggleRole,
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

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Entidades</label>
        <div className="space-y-2">
          {entities.map((entity) => (
            <div key={entity} className="flex items-center space-x-2">
              <Checkbox
                id={`entity-${entity}`}
                checked={selectedEntities.includes(entity)}
                onCheckedChange={() => onToggleEntity(entity)}
              />
              <label
                htmlFor={`entity-${entity}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {entity}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Funcao</label>
        <div className="space-y-2">
          {roles.map((role) => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                id={`role-${role}`}
                checked={selectedRoles.includes(role)}
                onCheckedChange={() => onToggleRole(role)}
              />
              <label
                htmlFor={`role-${role}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {role}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ListFilter className="h-4 w-4" />
              Filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Entidades</DropdownMenuLabel>
            <div className="p-2 space-y-2">
              {entities.map((entity) => (
                <div key={entity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dropdown-entity-${entity}`}
                    checked={selectedEntities.includes(entity)}
                    onCheckedChange={() => onToggleEntity(entity)}
                  />
                  <label
                    htmlFor={`dropdown-entity-${entity}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {entity}
                  </label>
                </div>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Funcao</DropdownMenuLabel>
            <div className="p-2 space-y-2">
              {roles.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dropdown-role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => onToggleRole(role)}
                  />
                  <label
                    htmlFor={`dropdown-role-${role}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {role}
                  </label>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" className="gap-2" onClick={onNewUserClick}>
          <UserPlus className="h-4 w-4" />
          Criar usuário
        </Button>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ListFilter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Filtros</h3>
              <FilterContent />
            </div>
          </PopoverContent>
        </Popover>
        <Button size="sm" className="gap-2" onClick={onNewUserClick}>
          <UserPlus className="h-4 w-4" />
          Criar usuario
        </Button>
      </div>
    </>
  );
}
