import { useEffect, useRef, useState } from "react";
import type { Ticket } from "../types/ticketTypes";

export function useTicketsNavigation({ isMobile }: { isMobile: boolean }) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const prevSelectedTicket = useRef<Ticket | null>(null);
  const prevIsDetailsOpen = useRef(false);
  const prevIsNewTicketOpen = useRef(false);

  useEffect(() => {
    if (!isMobile) return;
    if (!window.history.state || window.history.state?.ticketsBase !== true) {
      window.history.replaceState({ ticketsBase: true }, "");
    }

    const handlePopState = () => {
      const state = window.history.state;
      if (state?.attachmentViewer || state?.attachmentViewerBase) {
        return;
      }
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
  }, [isMobile, isNewTicketOpen, isDetailsOpen, selectedTicket]);

  useEffect(() => {
    if (!isMobile) return;

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
  }, [isMobile, isNewTicketOpen, isDetailsOpen, selectedTicket]);

  const handleBack = () => {
    setSelectedTicket(null);
  };

  return {
    selectedTicket,
    isDetailsOpen,
    isNewTicketOpen,
    setSelectedTicket,
    setIsDetailsOpen,
    setIsNewTicketOpen,
    handleBack,
  };
}
