import { useEffect, useRef } from "react";

type UseIOSSwipeGuardParams = {
  isIOS: boolean;
  isMobile: boolean;
};

export function useIOSSwipeGuard({ isIOS, isMobile }: UseIOSSwipeGuardParams) {
  const edgeGuardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const edgeGuard = edgeGuardRef.current;
    if (!edgeGuard || !isIOS || !isMobile) return;

    const preventSwipeBack = (event: TouchEvent) => {
      if (event.touches.length > 1) return;
      event.preventDefault();
    };

    edgeGuard.addEventListener("touchstart", preventSwipeBack, { passive: false });
    edgeGuard.addEventListener("touchmove", preventSwipeBack, { passive: false });

    return () => {
      edgeGuard.removeEventListener("touchstart", preventSwipeBack);
      edgeGuard.removeEventListener("touchmove", preventSwipeBack);
    };
  }, [isIOS, isMobile]);

  return edgeGuardRef;
}
