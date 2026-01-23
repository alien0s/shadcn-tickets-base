import { memo, type RefObject } from "react";
import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "@/features/sidebar/components/Sidebar";
import { TicketList } from "@/features/tickets/components/TicketList";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { TicketDetails } from "@/features/tickets/components/TicketDetails";
import { NoTicketSelected } from "@/features/chat/components/NoTicketSelected";
import type { Ticket } from "@/features/tickets/types/ticketTypes";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type TicketsLayoutProps = {
  selectedTicket: Ticket | null;
  isDetailsOpen: boolean;
  isNewTicketOpen: boolean;
  isMobile: boolean;
  isIOS: boolean;
  edgeGuardRef: RefObject<HTMLDivElement | null>;
  onSelectTicket: (ticket: Ticket) => void;
  onBack: () => void;
  onToggleDetails: () => void;
  onDetailsOpenChange: (open: boolean) => void;
  onNewTicketOpenChange: (open: boolean) => void;
};

/**
 * Layout principal da aplicação de tickets
 * 
 * Estrutura responsiva de 3 colunas:
 * 1. Sidebar com navegação (ícones)
 * 2. Lista de tickets (360px desktop, full mobile)
 * 3. Chat do ticket selecionado (flex-1)
 * 4. Detalhes do ticket (320px desktop XL, drawer em mobile/tablet)
 * 
 * @param selectedTicket - Ticket atualmente selecionado
 * @param isDetailsOpen - Controla abertura do drawer de detalhes (mobile/tablet)
 * @param isNewTicketOpen - Controla abertura do modal de novo ticket
 * @param isMobile - Indica se está em viewport mobile
 * @param isIOS - Indica se é dispositivo iOS (para edge guard)
 * @param edgeGuardRef - Ref para área de proteção contra swipe back do iOS
 * @param onSelectTicket - Handler para selecionar um ticket
 * @param onBack - Handler para voltar à lista (mobile)
 * @param onToggleDetails - Handler para abrir/fechar detalhes
 * @param onDetailsOpenChange - Handler para mudança de estado do drawer
 * @param onNewTicketOpenChange - Handler para mudança de estado do modal
 */
function TicketsLayoutComponent({
  selectedTicket,
  isDetailsOpen,
  isNewTicketOpen,
  isMobile,
  isIOS,
  edgeGuardRef,
  onSelectTicket,
  onBack,
  onToggleDetails,
  onDetailsOpenChange,
  onNewTicketOpenChange,
}: TicketsLayoutProps) {
  return (
    <SidebarProvider>
      {/* Container principal - altura 100dvh com fallback para --app-height */}
      <div className="h-[100dvh] [height:var(--app-height,100dvh)] w-full bg-background text-foreground flex">
        
        {/* Edge guard - previne swipe back do iOS Safari interferindo com gestos internos */}
        {isIOS && isMobile && (
          <div
            ref={edgeGuardRef}
            className="fixed left-0 top-0 h-full w-5 z-50 touch-none bg-transparent"
            aria-hidden="true"
          />
        )}

        {/* Sidebar com ícones de navegação */}
        <Sidebar />

        {/* Área principal com layout de 3 colunas */}
        <div className="flex-1 flex min-w-0">
          
          {/* Coluna 1: Lista de tickets */}
          <div
            className={`w-full md:w-[360px] border-r border-border flex flex-col md:min-w-[280px]
            ${selectedTicket ? "hidden md:flex" : "flex"}
          `}
          >
            <TicketList
              onSelectTicket={onSelectTicket}
              isNewTicketOpen={isNewTicketOpen}
              onNewTicketOpenChange={onNewTicketOpenChange}
            />
          </div>

          {/* Coluna 2: Chat do ticket selecionado */}
          <div
            className={`flex-1 flex flex-col min-w-[320px]
            ${selectedTicket ? "flex" : "hidden md:flex"}
          `}
          >
            {selectedTicket ? (
              <ChatWindow
                ticket={selectedTicket}
                onToggleDetails={onToggleDetails}
                onBack={onBack}
              />
            ) : (
              <NoTicketSelected />
            )}
          </div>

          {/* Coluna 3: Detalhes do ticket (Desktop XL - coluna estática) */}
          {selectedTicket && (
            <div className="w-[320px] min-w-[280px] hidden xl:flex flex-col">
              <TicketDetails ticket={selectedTicket} />
            </div>
          )}

          {/* Detalhes do ticket (Tablet/Mobile - Sheet/Drawer lateral) */}
          <Sheet
            open={!!selectedTicket && isDetailsOpen}
            onOpenChange={onDetailsOpenChange}
          >
            <SheetContent
              side="right"
              className="w-full sm:w-[400px] p-0 border-l border-border"
              showClose={false}
            >
              {selectedTicket && (
                <TicketDetails
                  ticket={selectedTicket}
                  onClose={() => onDetailsOpenChange(false)}
                  isDrawer
                />
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Memoiza o componente para evitar re-renders desnecessários
// Só re-renderiza quando as props realmente mudarem
export const TicketsLayout = memo(TicketsLayoutComponent);