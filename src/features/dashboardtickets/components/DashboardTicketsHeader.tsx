import { useCallback } from "react";
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

  // ✅ callback estável (útil se Button/children forem memoizados)
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <Button
          type="button" // ✅ evita submit acidental em forms
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={handleToggleSidebar}
          aria-label="Abrir/fechar menu lateral" // ✅ a11y para botão ícone
        >
          <PanelRight className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight">Dashboard</h1>
        </div>
      </div>

      <Button
        type="button" // ✅ evita submit acidental em forms
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleRefresh}
        disabled={isLoading}
        aria-busy={isLoading} // ✅ indica estado de carregamento para leitores de tela
      >
        <RefreshCcw
          className={cn("h-4 w-4", isLoading && "animate-spin")}
          aria-hidden="true"
        />
        Atualizar
      </Button>
    </div>
  );
}
