import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { House, LifeBuoy, MessageCircle, PanelLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarItem } from "./SidebarItem";
import { SidebarUserSection } from "./SidebarUserSection";
import { useSidebarOutsideClose } from "../hooks/useSidebarOutsideClose";
import { useUserNav } from "../hooks/useUserNav";

export function Sidebar() {
  const { isCollapsed, toggleSidebar, closeSidebar } = useSidebar();
  const sidebarRef = useSidebarOutsideClose({ isCollapsed, closeSidebar });
  const userNav = useUserNav();

  return (
    <>
      {/* Backdrop - apenas mobile quando sidebar estÇ­ aberto */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <aside
        ref={sidebarRef}
        className={[
          "flex flex-col border-r border-border bg-card backdrop-blur overflow-hidden",
          "transition-all duration-300 ease-out",
          // Mobile: fixed overlay
          "md:relative fixed top-0 left-0 h-[var(--app-height)] max-h-[var(--app-height)] md:h-[var(--app-height)] md:max-h-[var(--app-height)] z-50",
          isCollapsed ? "w-[60px]" : "w-[240px]",
          // Mobile: esconde completamente quando collapsed
          isCollapsed && "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="relative flex items-center justify-between h-14 px-3.5 border-b border-border group">
          <div className="flex items-center gap-2 w-full">
            <div className="h-8 w-8 bg-primary rounded-md shrink-0" />
            {!isCollapsed && (
              <span className="font-semibold text-sm tracking-tight truncate">
                Support
              </span>
            )}
          </div>

          {/* BotÇœo de colapsar sidebar */}
          <div
            className={[
              "flex items-center",
              isCollapsed
                ? "absolute inset-0 justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                : "",
            ].join(" ")}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-md h-8 w-8 group bg-card hover:bg-accent z-20"
                  onClick={toggleSidebar}
                >
                  <PanelLeft className="text-gray-300 dark:text-gray-500 group-hover:text-primary transition-colors" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isCollapsed ? "Expandir menu" : "Recolher menu"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* NavegaÇõÇœo principal */}
        <nav
          className={[
            "flex-1 min-h-0 flex flex-col py-3 gap-1 px-2 overflow-y-auto",
            // isCollapsed ? "items-center" : "", // Removed to fix animation
          ].join(" ")}
        >
          <NavLink to="/dashboardtickets" className="block">
            {({ isActive }) => (
              <SidebarItem
                icon={House}
                label="Dashboard"
                collapsed={isCollapsed}
                active={isActive}
              />
            )}
          </NavLink>

          <NavLink to="/tickets" className="block">
            {({ isActive }) => (
              <SidebarItem
                icon={MessageCircle}
                label="Tickets"
                collapsed={isCollapsed}
                active={isActive}
              />
            )}
          </NavLink>

          {/* Base de ajuda */}
          <NavLink to="/help-center" className="block">
            {({ isActive }) => (
              <SidebarItem
                icon={LifeBuoy}
                label="Base de ajuda"
                collapsed={isCollapsed}
                active={isActive}
              />
            )}
          </NavLink>
        </nav>

        {/* Itens inferiores: Suporte, DocumentaÇõÇœo e perfil */}
        <SidebarUserSection isCollapsed={isCollapsed} userNav={userNav} />
      </aside>
    </>
  );
}
