import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "@/features/sidebar/components/Sidebar";
import { Settings } from "@/features/settings/Settings";

/**
 * Página de Configurações
 * 
 * Exibe as configurações do sistema (perfil, preferências, notificações, etc).
 * Layout com sidebar lateral fixa e área principal para formulários de configuração.
 * 
 * @component
 * 
 * Estrutura:
 * - Sidebar: Navegação lateral com ícones
 * - Settings: Área principal com formulários e opções de configuração
 */
export function SettingsPage() {
  return (
    <SidebarProvider>
      {/* Container principal - altura mínima 100dvh com fallback para --app-height */}
      <div className="min-h-[100dvh] [min-height:var(--app-height,100dvh)] w-full bg-background text-foreground flex">
        
        {/* Sidebar com navegação */}
        <Sidebar />
        
        {/* Área principal de configurações */}
        <Settings />
      </div>
    </SidebarProvider>
  );
}