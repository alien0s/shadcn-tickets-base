import type { RefObject } from "react";
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

export function TicketsLayout({
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
      <div className="h-[100dvh] [height:var(--app-height,100dvh)] w-full bg-background text-foreground flex">
        {isIOS && isMobile && (
          <div
            ref={edgeGuardRef}
            className="fixed left-0 top-0 h-full w-5 z-50 touch-none bg-transparent"
            aria-hidden="true"
          />
        )}
        {/* Sidebar with icons */}
        <Sidebar />

        {/* Main area split into 3 columns */}
        <div className="flex-1 flex min-w-0">
          {/* Lista de tickets / conversas */}
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

          {/* Chat do ticket selecionado */}
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

          {/* Ticket details (Desktop: static column) */}
          {selectedTicket && (
            <div className="w-[320px] min-w-[280px] hidden xl:flex flex-col">
              <TicketDetails ticket={selectedTicket} />
            </div>
          )}

          {/* Ticket details (Tablet/Mobile: Drawer/Sheet) */}
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
