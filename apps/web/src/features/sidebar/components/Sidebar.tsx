import { useMemo } from "react";
import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { NavLink, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ContactRound,
  Grid2x2Check,
  ExternalLink,
  FileText,
  FolderClock,
  GraduationCap,
  PanelLeft,
  School,
  Headset,
  Users,
  Building
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./SidebarItem";
import { UserNav } from "./UserNav";
import { TenantsDropdown } from "./tenants";
import { useSidebarOutsideClose } from "../hooks/useSidebarOutsideClose";
import { useUserNav } from "../hooks/useUserNav";
import { useAuth } from "@/features/auth";
import { BRAND_NAME } from "@/config/brand";
import { AppLogo } from "@/components/logo";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  openInNewTab?: boolean;
};

const ADMIN_DEPARTMENT_ID = "7240712b-96de-418a-b6b3-344d12d64237";

export function Sidebar() {
  const { isCollapsed, toggleSidebar, closeSidebar } = useSidebar();
  const location = useLocation();
  const sidebarRef = useSidebarOutsideClose({ isCollapsed, closeSidebar });
  const userNav = useUserNav();
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const canSeeAdminGroup =
    user?.role === "root" || user?.department_id === ADMIN_DEPARTMENT_ID;

  const mainItems = useMemo<readonly NavItem[]>(
    () => [
      ...(isClient
        ? []
        : [{ to: "/dashboardtickets", label: "Dashboard", icon: BarChart3 }]),
      { to: "/grade", label: "Grade", icon: Grid2x2Check },
      { to: "/matriz", label: "Matriz", icon: FolderClock },
      { to: "/turmas", label: "Turmas", icon: GraduationCap },
      { to: "/professores", label: "Professores", icon: ContactRound },
      { to: "/escolas", label: "Escolas", icon: School },
    ],
    [isClient]
  );

  const adminItems = useMemo<readonly NavItem[]>(
    () =>
      !canSeeAdminGroup
        ? []
        : [
            { to: "/users", label: "Usuários", icon: Users },
            { to: "/organizacao", label: "Organização", icon: Building },
          ],
    [canSeeAdminGroup]
  );

  const bottomItems = useMemo<readonly NavItem[]>(
    () => [
      { to: "/tickets", label: "Tickets", icon: Headset, openInNewTab: true },
      { to: "/docs", label: "Documentação", icon: FileText },
    ],
    []
  );

  const collapseLabel = isCollapsed ? "Expandir menu" : "Recolher menu";

  return (
    <>
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
          "md:relative fixed top-0 left-0 h-[var(--app-height)] max-h-[var(--app-height)] md:h-[var(--app-height)] md:max-h-[var(--app-height)] z-50",
          isCollapsed ? "w-[60px]" : "w-[240px]",
          isCollapsed && "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="relative flex items-center justify-between h-14 px-3.5 border-b border-border group">
          <div className="flex items-center gap-2 w-full">
            <div className="shrink-0">
              <AppLogo size={28} hideText />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-md tracking-normal truncate">
                {BRAND_NAME}
              </span>
            )}
          </div>

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

        <TenantsDropdown collapsed={isCollapsed} />

        <nav
          className="flex-1 min-h-0 grid grid-rows-[1fr_auto] py-3 px-2"
          aria-label="Navega��o principal"
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

            {adminItems.length > 0 && !isCollapsed && (
              <div className="px-2 pt-2 pb-1">
                <p className="sidebar-group-label px-2 text-xs font-medium text-muted-foreground">
                  Admin
                </p>
              </div>
            )}

            {adminItems.map((item) => (
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

          <div className="pt-3 flex flex-col gap-1">
            {bottomItems.map((item, idx) => (
              item.openInNewTab ? (
                (() => {
                  const isActive =
                    location.pathname === item.to ||
                    location.pathname.startsWith(`${item.to}/`);

                  return (
                <a
                  key={`${item.to}-${idx}`}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size={isCollapsed ? "icon" : "default"}
                    aria-label={isCollapsed ? item.label : undefined}
                    className={cn(
                      "sidebar-nav-btn justify-start",
                      isCollapsed ? "justify-start w-full pl-[0.87rem]" : "gap-2 w-full pl-[0.85rem]"
                      ,
                      isActive
                        ? "sidebar-nav-active hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 dark:hover:text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-[1.4rem] w-[1.4rem]" aria-hidden="true" />
                    {!isCollapsed && <span className="text-sm">{item.label}</span>}
                    {!isCollapsed && (
                      <ExternalLink className="ml-auto h-4 w-4 opacity-70" aria-hidden="true" />
                    )}
                  </Button>
                </a>
                  );
                })()
              ) : (
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
              )
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
