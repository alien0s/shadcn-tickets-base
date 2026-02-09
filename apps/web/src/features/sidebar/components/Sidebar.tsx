import { useMemo } from "react";
import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  House,
  LifeBuoy,
  MessageCircle,
  PanelLeft,
  Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./SidebarItem";
import { UserNav } from "./UserNav";
import { useSidebarOutsideClose } from "../hooks/useSidebarOutsideClose";
import { useUserNav } from "../hooks/useUserNav";
import { useAuth } from "@/features/auth";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function Sidebar() {
  const { isCollapsed, toggleSidebar, closeSidebar } = useSidebar();
  const sidebarRef = useSidebarOutsideClose({ isCollapsed, closeSidebar });
  const userNav = useUserNav();
  const { user } = useAuth();
  const isClient = user?.role === "client";

  // ✅ evita duplicação e mantém render previsível (sem mudar UI)
  const mainItems = useMemo<readonly NavItem[]>(
    () => [
      ...(isClient
        ? []
        : [{ to: "/dashboardtickets", label: "Dashboard", icon: House }]),
      { to: "/tickets", label: "Tickets", icon: MessageCircle },
      { to: "/help-center", label: "Base de ajuda", icon: LifeBuoy },
    ],
    [isClient]
  );

  // ⚠️ Mantive seus paths exatamente como estão (mesmo repetidos em "/users")
  // porque você não pediu pra corrigir rotas.
  const bottomItems = useMemo<readonly NavItem[]>(
    () => [
      ...(isClient ? [] : [{ to: "/users", label: "Usuários", icon: Users }]),
      { to: "/users", label: "Suporte", icon: LifeBuoy },
      { to: "/users", label: "Documentação", icon: FileText },
    ],
    [isClient]
  );

  const collapseLabel = isCollapsed ? "Expandir menu" : "Recolher menu";

  return (
    <>
      {/* Backdrop - apenas mobile quando sidebar estiver aberto */}
      {!isCollapsed && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
          aria-label="Fechar menu lateral"
        />
      )}

      <aside
        ref={sidebarRef}
        className={cn(
          "flex flex-col border-r border-border bg-card backdrop-blur overflow-hidden",
          "transition-all duration-300 ease-out",
          // Mobile: fixed overlay
          "md:relative fixed top-0 left-0 h-[var(--app-height)] max-h-[var(--app-height)] md:h-[var(--app-height)] md:max-h-[var(--app-height)] z-50",
          isCollapsed ? "w-[60px]" : "w-[240px]",
          // Mobile: esconde completamente quando collapsed
          isCollapsed && "-translate-x-full md:translate-x-0"
        )}
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

          {/* Botao de colapsar sidebar */}
          <div
            className={cn(
              "flex items-center",
              isCollapsed &&
                "absolute inset-0 justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-md h-8 w-8 group bg-card hover:bg-accent z-20"
                  onClick={toggleSidebar}
                  aria-label={collapseLabel}
                >
                  <PanelLeft
                    className="text-gray-300 dark:text-gray-500 group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{collapseLabel}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Navegacao principal */}
        <nav
          className="flex-1 min-h-0 grid grid-rows-[1fr_auto] py-3 px-2"
          aria-label="Navegação principal"
        >
          <div className="min-h-0 flex flex-col gap-1 overflow-y-auto">
            {mainItems.map((item) => (
              <NavLink key={item.to} to={item.to} className="block">
                {({ isActive }) => (
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    collapsed={isCollapsed}
                    active={isActive}
                  />
                )}
              </NavLink>
            ))}
          </div>

          {/* Itens inferiores: Suporte, Documentacao e perfil */}
          <div className="pt-3 flex flex-col gap-1">
            {bottomItems.map((item, idx) => (
              <NavLink key={`${item.to}-${idx}`} to={item.to} className="block">
                {({ isActive }) => (
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    collapsed={isCollapsed}
                    active={isActive}
                  />
                )}
              </NavLink>
            ))}

            <div className="mt-2">
              <UserNav isCollapsed={isCollapsed} {...userNav} />
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
