import { Button } from "@/components/ui/button";
import type { SidebarItemProps } from "../types";

export function SidebarItem({
  icon: Icon,
  label,
  collapsed,
  active,
  variant = "ghost",
  size = "default",
}: SidebarItemProps) {
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
