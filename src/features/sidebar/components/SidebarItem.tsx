import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      type="button" // ✅ evita submit acidental em forms
      variant={variant}
      size={collapsed ? "icon" : size}
      aria-label={collapsed ? label : undefined} // ✅ a11y quando só tem ícone
      className={cn(
        "sidebar-nav-btn justify-start",
        collapsed ? "justify-start w-full pl-[0.87rem]" : "gap-2 w-full pl-[0.85rem]",
        active
          ? "sidebar-nav-active hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 dark:hover:text-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
      {!collapsed && <span className="text-sm">{label}</span>}
    </Button>
  );
}
