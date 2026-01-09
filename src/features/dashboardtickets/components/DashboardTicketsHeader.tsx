import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { PanelRight, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardTicketsHeaderProps = {
  onRefresh: () => void;
  isLoading: boolean;
};

export function DashboardTicketsHeader({
  onRefresh,
  isLoading,
}: DashboardTicketsHeaderProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight">Dashboard Tickets</h1>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        Atualizar
      </Button>
    </div>
  );
}
