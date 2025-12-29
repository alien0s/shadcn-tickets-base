import { useEffect } from "react";

const isAndroidDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
};

export function useAndroidViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAndroidDevice()) return;

    const visualViewport = window.visualViewport;

    const updateVars = () => {
      const height = visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-height",
        `${Math.round(height)}px`
      );
    };

    const scheduleUpdate = () => {
      requestAnimationFrame(updateVars);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.addEventListener("focusin", scheduleUpdate);
    window.addEventListener("focusout", scheduleUpdate);

    if (visualViewport) {
      visualViewport.addEventListener("resize", scheduleUpdate);
      visualViewport.addEventListener("scroll", scheduleUpdate);
    }

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.removeEventListener("focusin", scheduleUpdate);
      window.removeEventListener("focusout", scheduleUpdate);

      if (visualViewport) {
        visualViewport.removeEventListener("resize", scheduleUpdate);
        visualViewport.removeEventListener("scroll", scheduleUpdate);
      }
    };
  }, []);
}
