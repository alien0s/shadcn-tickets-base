import { useEffect } from "react";

const isIOSDevice = () => {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export function useAppViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isIOSDevice()) return;

    const visualViewport = window.visualViewport;

    const updateVars = () => {
      if (!visualViewport) return;
      document.documentElement.style.setProperty(
        "--app-height",
        `${Math.round(visualViewport.height)}px`
      );
    };

    const scheduleUpdate = () => {
      requestAnimationFrame(updateVars);
    };

    scheduleUpdate();

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    if (visualViewport) {
      visualViewport.addEventListener("resize", scheduleUpdate);
      visualViewport.addEventListener("scroll", scheduleUpdate);
    }

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);

      if (visualViewport) {
        visualViewport.removeEventListener("resize", scheduleUpdate);
        visualViewport.removeEventListener("scroll", scheduleUpdate);
      }
    };
  }, []);
}
