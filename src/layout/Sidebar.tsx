import React from "react";
import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import {
  LifeBuoy,
  Settings,
  TicketIcon,
  FileChartLine,
  LayoutGrid,
  PanelRight,
  MessageCircle
} from "lucide-react";
import { UserNav } from "./UserNav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={[
        "flex flex-col border-r border-border bg-card/80 backdrop-blur",
        "transition-all duration-300 ease-out",
        isCollapsed ? "w-[60px]" : "w-[240px]",
      ].join(" ")}
    >
      {/* Topo: logo + actions (toggle tema + colapsar) */}
      <div className="relative flex items-center justify-between h-14 px-3.5 border-b border-border group">
        <div className="flex items-center gap-2 w-full">
          <div className="h-8 w-8 bg-primary rounded-md shrink-0" />
          {!isCollapsed && (
            <span className="font-semibold text-sm tracking-tight truncate">
              Support Desk
            </span>
          )}
        </div>

        {/* Botão de colapsar sidebar */}
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
                <PanelRight className="text-gray-300 dark:text-gray-500 group-hover:text-primary transition-colors" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isCollapsed ? "Expandir menu" : "Recolher menu"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Navegação principal */}
      <nav
        className={[
          "flex-1 flex flex-col py-3 gap-1 px-2",
          // isCollapsed ? "items-center" : "", // Removed to fix animation
        ].join(" ")}
      >
        <NavLink to="/dashboard" className="block">
          {({ isActive }) => (
            <SidebarNavItem
              icon={FileChartLine}
              label="Dashboard"
              collapsed={isCollapsed}
              active={isActive}
            />
          )}
        </NavLink>

        <NavLink to="/tickets" className="block">
          {({ isActive }) => (
            <SidebarNavItem
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
            <SidebarNavItem
              icon={LifeBuoy}
              label="Base de ajuda"
              collapsed={isCollapsed}
              active={isActive}
            />
          )}
        </NavLink>

      </nav>



      {/* Itens inferiores: Suporte, Documentação e perfil */}
      <div className="px-2 pb-2 flex flex-col gap-1">
        <SidebarNavItem
          icon={LifeBuoy}
          label="Suporte"
          collapsed={isCollapsed}
          variant="ghost"
          size="sm"
        />
        <SidebarNavItem
          icon={Settings}
          label="Documentação"
          collapsed={isCollapsed}
          variant="ghost"
          size="sm"
        />

        <div className="mt-2">
          <UserNav isCollapsed={isCollapsed} />
        </div>
      </div>
    </aside>
  );
}

type SidebarNavItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  active?: boolean;
  variant?: "ghost" | "outline" | "default";
  size?: "icon" | "sm" | "default";
};

function SidebarNavItem({
  icon: Icon,
  label,
  collapsed,
  active,
  variant = "ghost",
  size = "default",
}: SidebarNavItemProps) {
  return (
    <Button
      variant={variant}
      size={collapsed ? "icon" : size}
      className={[
        "sidebar-nav-btn justify-start",
        collapsed ? "justify-center w-10" : "gap-2 w-full pl-2.5",
        active ? "sidebar-nav-active" : "text-muted-foreground",
      ].join(" ")}
    >
      <Icon className="h-6 w-6" />
      {!collapsed && <span className="text-sm">{label}</span>}
    </Button>
  );
}


