import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "@/features/sidebar/components/Sidebar";
import { Settings } from "@/features/settings/Settings";

export function SettingsPage() {
  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] [min-height:var(--app-height,100dvh)] w-full bg-background text-foreground flex">
        <Sidebar />
        <Settings />
      </div>
    </SidebarProvider>
  );
}
