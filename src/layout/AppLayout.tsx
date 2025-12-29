import { useEffect, useRef, useState } from "react";
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
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const prevSelectedTicket = useRef<Ticket | null>(null);
  const prevIsDetailsOpen = useRef(false);
  const prevIsNewTicketOpen = useRef(false);
  const isMobileRef = useRef(false);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => {
      isMobileRef.current = mediaQuery.matches;
    };
    updateIsMobile();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateIsMobile);
    } else {
      mediaQuery.addListener(updateIsMobile);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateIsMobile);
      } else {
        mediaQuery.removeListener(updateIsMobile);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobileRef.current) return;
    if (!window.history.state || window.history.state?.ticketsBase !== true) {
      window.history.replaceState({ ticketsBase: true }, "");
    }

    const handlePopState = () => {
      if (isNewTicketOpen) {
        setIsNewTicketOpen(false);
        window.history.pushState({ ticketsBase: true }, "");
        return;
      }
      if (isDetailsOpen) {
        setIsDetailsOpen(false);
        window.history.pushState({ ticketsBase: true }, "");
        return;
      }
      if (selectedTicket) {
        setSelectedTicket(null);
        window.history.pushState({ ticketsBase: true }, "");
        return;
      }

      // Prevent leaving /tickets on mobile back when already at base.
      window.history.pushState({ ticketsBase: true }, "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isNewTicketOpen, isDetailsOpen, selectedTicket]);

  useEffect(() => {
    if (!isMobileRef.current) return;

    if (!prevIsNewTicketOpen.current && isNewTicketOpen) {
      window.history.pushState({ ticketsLayer: "new-ticket" }, "");
    }

    if (!prevIsDetailsOpen.current && isDetailsOpen) {
      window.history.pushState({ ticketsLayer: "details" }, "");
    }

    if (!prevSelectedTicket.current && selectedTicket) {
      window.history.pushState({ ticketsLayer: "chat" }, "");
    }

    prevIsNewTicketOpen.current = isNewTicketOpen;
    prevIsDetailsOpen.current = isDetailsOpen;
    prevSelectedTicket.current = selectedTicket;
  }, [isNewTicketOpen, isDetailsOpen, selectedTicket]);

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] w-full bg-background text-foreground flex">
        {/* Sidebar recolhível com ícones */}
        <Sidebar />

        {/* Área principal dividida em 3 colunas */}
        <div className="flex-1 flex min-w-0">
          {/* Lista de tickets / conversas */}
          <div className={`w-full md:w-[360px] border-r border-border flex flex-col md:min-w-[280px]
            ${selectedTicket ? 'hidden md:flex' : 'flex'}
          `}>
            <TicketList
              onSelectTicket={handleSelectTicket}
              isNewTicketOpen={isNewTicketOpen}
              onNewTicketOpenChange={setIsNewTicketOpen}
            />
          </div>

          {/* Chat do ticket selecionado */}
          <div className={`flex-1 flex flex-col min-w-[320px]
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
