import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

// ✅ aceita lucide (ideal) e continua aceitando qualquer componente compatível com className
export type SidebarIcon = LucideIcon | ComponentType<{ className?: string }>;

export type SidebarItemProps = {
  icon: SidebarIcon;
  label: string;
  collapsed: boolean;
  active?: boolean;
  variant?: "ghost" | "outline" | "default";
  size?: "icon" | "sm" | "default";
};

export type UserNavState = {
  theme: "light" | "dark" | "system";
  setTheme: (value: "light" | "dark" | "system") => void;
  onNavigateSettings: () => void;
};

export type UserNavProps = UserNavState & {
  isCollapsed: boolean;
};
