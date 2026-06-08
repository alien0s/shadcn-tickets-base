import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrganizationHeaderProps = {
  onToggleSidebar: () => void;
};

export function OrganizationHeader({ onToggleSidebar }: OrganizationHeaderProps) {
  return (
    <header className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
        aria-label="Abrir/fechar menu lateral"
      >
        <PanelRight className="h-4 w-4" aria-hidden="true" />
      </Button>

      <h1 className="text-2xl font-bold leading-tight">Organizacao</h1>
    </header>
  );
}
