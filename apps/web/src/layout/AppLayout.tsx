import type { ReactNode } from "react";
import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "@/features/sidebar/components/Sidebar";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="h-[var(--app-height,100dvh)] w-full bg-background text-foreground flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
