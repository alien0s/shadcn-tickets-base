import { useEffect, useMemo, useRef, useState } from "react";
import type { Ticket } from "@/features/tickets/types/ticketTypes";
import { TicketsLayout } from "@/layout/TicketsLayout";

export function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prevSelectedTicket = useRef<Ticket | null>(null);
  const prevIsDetailsOpen = useRef(false);
  const prevIsNewTicketOpen = useRef(false);
  const isMobileRef = useRef(false);
  const edgeGuardRef = useRef<HTMLDivElement>(null);
  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => {
      const matches = mediaQuery.matches;
      isMobileRef.current = matches;
      setIsMobile(matches);
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
    const edgeGuard = edgeGuardRef.current;
    if (!edgeGuard || !isIOS || !isMobile) return;

    const preventSwipeBack = (event: TouchEvent) => {
      if (event.touches.length > 1) return;
      event.preventDefault();
    };

    edgeGuard.addEventListener("touchstart", preventSwipeBack, { passive: false });
    edgeGuard.addEventListener("touchmove", preventSwipeBack, { passive: false });

    return () => {
      edgeGuard.removeEventListener("touchstart", preventSwipeBack);
      edgeGuard.removeEventListener("touchmove", preventSwipeBack);
    };
  }, [isIOS, isMobile]);

  useEffect(() => {
    if (!isMobileRef.current) return;
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
    <TicketsLayout
      selectedTicket={selectedTicket}
      isDetailsOpen={isDetailsOpen}
      isNewTicketOpen={isNewTicketOpen}
      isMobile={isMobile}
      isIOS={isIOS}
      edgeGuardRef={edgeGuardRef}
      onSelectTicket={handleSelectTicket}
      onBack={handleBackToList}
      onToggleDetails={() => setIsDetailsOpen(true)}
      onDetailsOpenChange={setIsDetailsOpen}
      onNewTicketOpenChange={setIsNewTicketOpen}
    />
  );
}
