import { useState } from "react";
import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "./Sidebar";
import { TicketList } from "@/features/tickets/TicketList";
import { ChatWindow } from "@/features/chat/ChatWindow";
import { TicketDetails } from "@/features/tickets/TicketDetails";
import { NoTicketSelected } from "@/features/chat/NoTicketSelected";
import type { Ticket } from "@/features/tickets/TicketListItem";

import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppLayout() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
  };

  return (
    <SidebarProvider>
      <div className="h-screen w-screen bg-background text-foreground flex">
        {/* Sidebar recolhível com ícones */}
        <Sidebar />

        {/* Área principal dividida em 3 colunas */}
        <div className="flex-1 flex min-w-0">
          {/* Lista de tickets / conversas */}
          <div className={`
            w-full md:w-[360px] 
            border-r border-border 
            flex flex-col 
            md:min-w-[280px]
            ${selectedTicket ? 'hidden md:flex' : 'flex'}
          `}>
            <TicketList onSelectTicket={handleSelectTicket} />
          </div>

          {/* Chat do ticket selecionado */}
          <div className={`
            flex-1 
            border-r border-border 
            flex flex-col 
            min-w-[320px]
            ${selectedTicket ? 'flex' : 'hidden md:flex'}
          `}>
            {selectedTicket ? (
              <ChatWindow
                ticket={selectedTicket}
                onToggleDetails={() => setIsDetailsOpen(true)}
                onBack={handleBackToList}
              />
            ) : (
              <NoTicketSelected />
            )}
          </div>

          {/* Detalhes do ticket (Desktop: Coluna estática) */}
          {selectedTicket && (
            <div className="w-[320px] min-w-[280px] hidden xl:flex flex-col">
              <TicketDetails ticket={selectedTicket} />
            </div>
          )}

          {/* Detalhes do ticket (Tablet/Mobile: Drawer/Sheet) */}
          <Sheet open={!!selectedTicket && isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0 border-l border-border" showClose={false}>
              {selectedTicket && (
                <TicketDetails ticket={selectedTicket} onClose={() => setIsDetailsOpen(false)} isDrawer />
              )}
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </SidebarProvider>
  );
}
