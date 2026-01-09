import type { ComponentType } from "react";

export type SidebarItemProps = {
  icon: ComponentType<{ className?: string }>;
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
