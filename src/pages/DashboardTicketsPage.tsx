import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "@/features/sidebar/components/Sidebar";
import { DashboardTickets } from "@/features/dashboardtickets/DashboardTickets";

/**
 * Página de Dashboard de Tickets
 * 
 * Exibe uma visão geral de métricas e estatísticas dos tickets.
 * Layout com sidebar lateral fixa e área principal para o dashboard.
 * 
 * @component
 * 
 * Estrutura:
 * - Sidebar: Navegação lateral com ícones
 * - DashboardTickets: Área principal com cards, gráficos e métricas
 */
export function DashboardTicketsPage() {
  return (
    <SidebarProvider>
      {/* Container principal - altura 100dvh com fallback para --app-height */}
      <div className="h-[var(--app-height,100dvh)] w-full bg-background text-foreground flex overflow-hidden">
        
        {/* Sidebar com navegação */}
        <Sidebar />
        
        {/* Área principal do dashboard */}
        <DashboardTickets />
      </div>
    </SidebarProvider>
  );
}
