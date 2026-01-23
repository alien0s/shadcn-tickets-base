import { useCallback } from "react";
import { TicketsLayout } from "@/layout/TicketsLayout";
import { useIOSSwipeGuard } from "@/features/tickets/hooks/useIOSSwipeGuard";
import { useTicketsDevice } from "@/features/tickets/hooks/useTicketsDevice";
import { useTicketsNavigation } from "@/features/tickets/hooks/useTicketsNavigation";

/**
 * Página principal de tickets/conversas
 * 
 * Gerencia a lógica de navegação, detecção de dispositivo e proteção contra
 * swipe back do iOS, delegando a renderização visual para o TicketsLayout.
 */
export function TicketsPage() {
  // Detecta tipo de dispositivo (mobile/desktop, iOS/Android)
  const { isMobile, isIOS } = useTicketsDevice();

  // Configura proteção contra swipe back do iOS Safari
  const edgeGuardRef = useIOSSwipeGuard({ isIOS, isMobile });

  // Gerencia estado de navegação (ticket selecionado, drawers, etc)
  const {
    selectedTicket,
    isDetailsOpen,
    isNewTicketOpen,
    setSelectedTicket,
    setIsDetailsOpen,
    setIsNewTicketOpen,
    handleBack,
  } = useTicketsNavigation({ isMobile });

  // Handler para abrir drawer de detalhes
  // Memoizado para não quebrar memoização do TicketsLayout
  const handleToggleDetails = useCallback(() => {
    setIsDetailsOpen(true);
  }, [setIsDetailsOpen]);

  return (
    <TicketsLayout
      selectedTicket={selectedTicket}
      isDetailsOpen={isDetailsOpen}
      isNewTicketOpen={isNewTicketOpen}
      isMobile={isMobile}
      isIOS={isIOS}
      edgeGuardRef={edgeGuardRef}
      onSelectTicket={setSelectedTicket}
      onBack={handleBack}
      onToggleDetails={handleToggleDetails}
      onDetailsOpenChange={setIsDetailsOpen}
      onNewTicketOpenChange={setIsNewTicketOpen}
    />
  );
}
