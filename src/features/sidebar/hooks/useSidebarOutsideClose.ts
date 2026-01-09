import { useEffect, useRef } from "react";

type UseSidebarOutsideCloseParams = {
  isCollapsed: boolean;
  closeSidebar: () => void;
};

export function useSidebarOutsideClose({
  isCollapsed,
  closeSidebar,
}: UseSidebarOutsideCloseParams) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 768 || isCollapsed) return;

      const target = event.target as Node;

      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      const clickedElement = event.target as HTMLElement;
      const isInsideDropdown =
        clickedElement.closest('[role="menu"]') ||
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

  return sidebarRef;
}
