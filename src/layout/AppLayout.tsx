import React, { useState } from "react";
import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "./Sidebar";
import { TicketList } from "@/features/tickets/TicketList";
import { ChatWindow } from "@/features/chat/ChatWindow";
import { TicketDetails } from "@/features/tickets/TicketDetails";
import { NoTicketSelected } from "@/features/chat/NoTicketSelected";
import type { Ticket } from "@/features/tickets/TicketListItem";

export function AppLayout() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  return (
    <SidebarProvider>
      <div className="h-screen w-screen bg-background text-foreground flex">
        {/* Sidebar recolhível com ícones */}
        <Sidebar />

        {/* Área principal dividida em 3 colunas */}
        <div className="flex-1 flex min-w-0">
          {/* Lista de tickets / conversas */}
          <div className="w-[360px] border-r border-border flex flex-col min-w-[280px]">
            <TicketList onSelectTicket={setSelectedTicket} />
          </div>

          {/* Chat do ticket selecionado */}
          <div className="flex-1 border-r border-border flex flex-col min-w-[320px]">
            {selectedTicket ? (
              <ChatWindow ticket={selectedTicket} />
            ) : (
              <NoTicketSelected />
            )}
          </div>

          {/* Detalhes do ticket (esqueleto por enquanto) */}
          <div className="w-[320px] min-w-[280px] hidden xl:flex flex-col">
            <TicketDetails />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
