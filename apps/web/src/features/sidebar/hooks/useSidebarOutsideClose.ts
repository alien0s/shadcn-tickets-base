import { useEffect, useRef } from "react";

type UseSidebarOutsideCloseParams = {
  isCollapsed: boolean;
  closeSidebar: () => void;
};

export function useSidebarOutsideClose({
  isCollapsed,
  closeSidebar,
}: UseSidebarOutsideCloseParams) {
  // ✅ ref corretamente tipada (pode ser null)
  const sidebarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // ✅ SSR safety
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

    const handlePointerDown = (event: PointerEvent | MouseEvent) => {
      if (isDesktop() || isCollapsed) return;

      const targetNode = event.target;
      if (!(targetNode instanceof Node)) return;

      // Clique dentro da sidebar -> não fecha
      if (sidebarRef.current && sidebarRef.current.contains(targetNode)) return;

      // Para `.closest`, precisamos de Element (Text nodes não têm closest)
      const targetEl = event.target instanceof Element ? event.target : null;

      // Ignora cliques dentro de dropdowns/menus Radix
      const isInsideDropdown =
        targetEl?.closest('[role="menu"]') ||
        targetEl?.closest('[data-radix-menu-content]') ||
        targetEl?.closest('[data-radix-popper-content-wrapper]');

      if (isInsideDropdown) return;

      closeSidebar();
    };

    // ✅ pointerdown cobre mouse + touch de forma mais consistente
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isCollapsed, closeSidebar]);

  return sidebarRef;
}
