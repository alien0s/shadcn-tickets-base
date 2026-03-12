import { memo, useCallback } from "react";
import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";

type TeachersHeaderProps = {
  count: number;
};

function TeachersHeaderComponent({ count }: TeachersHeaderProps) {
  const { toggleSidebar } = useSidebar();

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" className="md:hidden" onClick={handleToggleSidebar}>
        <PanelRight className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold leading-tight">Professores</h1>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
    </div>
  );
}

export const TeachersHeader = memo(TeachersHeaderComponent);

