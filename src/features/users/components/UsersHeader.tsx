import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";

type UsersHeaderProps = {
  count: number;
};

export function UsersHeader({ count }: UsersHeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <PanelRight className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold leading-tight">Usuários</h1>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
    </div>
  );
}
