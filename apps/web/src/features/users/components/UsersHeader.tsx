import { memo, useCallback } from "react";
import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";

type UsersHeaderProps = {
  count: number;
};

function UsersHeaderComponent({ count }: UsersHeaderProps) {
  const { toggleSidebar } = useSidebar();

  // Handler para abrir/fechar sidebar (apenas mobile)
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <div className="flex items-center gap-3">
      {/* Botão de toggle da sidebar (visível apenas em mobile) */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={handleToggleSidebar}
      >
        <PanelRight className="h-4 w-4" />
      </Button>

      {/* Título e contador de usuários */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold leading-tight">Usuários</h1>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
    </div>
  );
}

// Memoiza para evitar re-renders desnecessários
// Só re-renderiza quando o count mudar
export const UsersHeader = memo(UsersHeaderComponent);