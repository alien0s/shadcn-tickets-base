import React, { useEffect, useRef } from "react";
import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import {
  LifeBuoy,
  Users,
  House,
  MessageCircle,
  PanelLeft,
  FileText
} from "lucide-react";
import { UserNav } from "./UserNav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const { isCollapsed, toggleSidebar, closeSidebar } = useSidebar();
  const sidebarRef = useRef<HTMLElement>(null);

  // Click outside handler - apenas mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Só funciona em mobile (< 768px) e quando sidebar está aberto
      if (window.innerWidth >= 768 || isCollapsed) return;

      const target = event.target as Node;

      // Verifica se o clique foi dentro do sidebar
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      // Verifica se o clique foi dentro de um dropdown menu (UserNav)
      // Procura por elementos com role="menu" ou data-radix-menu-content
      const clickedElement = event.target as HTMLElement;
      const isInsideDropdown = clickedElement.closest('[role="menu"]') ||
        clickedElement.closest('[data-radix-menu-content]') ||
        clickedElement.closest('[data-radix-popper-content-wrapper]');

      if (isInsideDropdown) {
        return;
      }

      closeSidebar();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCollapsed, closeSidebar]);

  return (
    <>
      {/* Backdrop - apenas mobile quando sidebar está aberto */}
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
          "md:relative fixed top-0 left-0 h-[100svh] max-h-[100svh] min-[500px]:h-[100dvh] min-[500px]:max-h-[100dvh] md:h-screen md:max-h-screen z-50",
          isCollapsed ? "w-[60px]" : "w-[240px]",
          // Mobile: esconde completamente quando collapsed
          isCollapsed && "-translate-x-full md:translate-x-0",
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
                  <PanelLeft className="text-gray-300 dark:text-gray-500 group-hover:text-primary transition-colors" />
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
            "flex-1 min-h-0 flex flex-col py-3 gap-1 px-2 overflow-y-auto",
            // isCollapsed ? "items-center" : "", // Removed to fix animation
          ].join(" ")}
        >
          <NavLink to="/dashboard" className="block">
            {({ isActive }) => (
              <SidebarNavItem
                icon={House}
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
        <div className="px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex flex-col gap-1">
          <NavLink to="/users" className="block">
            {({ isActive }) => (
              <SidebarNavItem
                icon={Users}
                label="Usuários"
                collapsed={isCollapsed}
                active={isActive}
              />
            )}
          </NavLink>
          <SidebarNavItem
            icon={LifeBuoy}
            label="Suporte"
            collapsed={isCollapsed}
            variant="ghost"
            size="sm"
          />
          <SidebarNavItem
            icon={FileText}
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
    </>
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
        active
          ? "sidebar-nav-active hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 dark:hover:text-foreground"
          : "text-muted-foreground",
      ].join(" ")}
    >
      <Icon className="h-6 w-6" />
      {!collapsed && <span className="text-sm">{label}</span>}
    </Button>
  );
}


