import { useEffect } from "react";

const IOS_KEYBOARD_THRESHOLD_PX = 100;

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
    if (!isIOSDevice()) return;

    const visualViewport = window.visualViewport;

    const updateVars = () => {
      const keyboardHeight = visualViewport
        ? Math.max(0, Math.round(window.innerHeight - visualViewport.height))
        : 0;
      const keyboardOpen = keyboardHeight > IOS_KEYBOARD_THRESHOLD_PX;

      if (keyboardOpen) {
        document.documentElement.style.setProperty("--safe-bottom", "0px");
        document.documentElement.classList.add("ios-keyboard-open");
      } else {
        document.documentElement.style.setProperty(
          "--safe-bottom",
          "env(safe-area-inset-bottom)"
        );
        document.documentElement.classList.remove("ios-keyboard-open");
      }
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
