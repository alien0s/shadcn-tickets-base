import { TicketsLayout } from "@/layout/TicketsLayout";
import { useIOSSwipeGuard } from "@/features/tickets/hooks/useIOSSwipeGuard";
import { useTicketsDevice } from "@/features/tickets/hooks/useTicketsDevice";
import { useTicketsNavigation } from "@/features/tickets/hooks/useTicketsNavigation";

export function TicketsPage() {
  const { isMobile, isIOS } = useTicketsDevice();
  const edgeGuardRef = useIOSSwipeGuard({ isIOS, isMobile });
  const {
    selectedTicket,
    isDetailsOpen,
    isNewTicketOpen,
    setSelectedTicket,
    setIsDetailsOpen,
    setIsNewTicketOpen,
    handleBack,
  } = useTicketsNavigation({ isMobile });

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
      onToggleDetails={() => setIsDetailsOpen(true)}
      onDetailsOpenChange={setIsDetailsOpen}
      onNewTicketOpenChange={setIsNewTicketOpen}
    />
  );
}
