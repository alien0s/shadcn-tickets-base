import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "@/features/sidebar/components/Sidebar";
import { DashboardTickets } from "@/features/dashboardtickets/DashboardTickets";

export function DashboardTicketsPage() {
  return (
    <SidebarProvider>
      <div className="h-[var(--app-height,100dvh)] w-full bg-background text-foreground flex overflow-hidden">
        <Sidebar />
        <DashboardTickets />
      </div>
    </SidebarProvider>
  );
}
