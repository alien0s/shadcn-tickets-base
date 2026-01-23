import { NavLink } from "react-router-dom";
import { FileText, LifeBuoy, Users } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { UserNav } from "./UserNav";
import type { UserNavState } from "../types";

type SidebarUserSectionProps = {
  isCollapsed: boolean;
  userNav: UserNavState;
};

export function SidebarUserSection({ isCollapsed, userNav }: SidebarUserSectionProps) {
  return (
    <div
      className="px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex flex-col gap-1"
      aria-label="Seção de usuário"
    >
      <NavLink to="/users" className="block">
        {({ isActive }) => (
          <SidebarItem
            icon={Users}
            label="Usuários"
            collapsed={isCollapsed}
            active={isActive}
          />
        )}
      </NavLink>

      {/* Itens abaixo são placeholders (sem navegação). Mantidos sem alteração de comportamento. */}
      <SidebarItem
        icon={LifeBuoy}
        label="Suporte"
        collapsed={isCollapsed}
        variant="ghost"
        size="sm"
      />
      <SidebarItem
        icon={FileText}
        label="Documentação"
        collapsed={isCollapsed}
        variant="ghost"
        size="sm"
      />

      <div className="mt-2">
        <UserNav isCollapsed={isCollapsed} {...userNav} />
      </div>
    </div>
  );
}
