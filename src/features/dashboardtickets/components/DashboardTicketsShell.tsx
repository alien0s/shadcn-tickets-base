import { DashboardTicketsHeader } from "./DashboardTicketsHeader";
import { DashboardTicketsGrid } from "./DashboardTicketsGrid";
import { DashboardTicketsSkeleton } from "./DashboardTicketsSkeleton";
import { useDashboardTicketsData } from "../hooks/useDashboardTicketsData";

export function DashboardTicketsShell() {
  const { data, isLoading, loadDashboard } = useDashboardTicketsData();

  return (
    <main className="flex-1 min-h-0 overflow-y-auto md:pt-0">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-border h-14">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-3 sm:px-5 lg:px-8 h-full">
          <DashboardTicketsHeader onRefresh={loadDashboard} isLoading={isLoading} />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-5 sm:px-5 lg:px-8 md:pt-2 md:pb-2">
        {isLoading || !data ? (
          <DashboardTicketsSkeleton />
        ) : (
          <DashboardTicketsGrid data={data} />
        )}
      </div>
    </main>
  );
}
