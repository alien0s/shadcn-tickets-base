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
      const height = visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-height",
        `${Math.round(height)}px`
      );

      const keyboardOpen = !!visualViewport
        && window.innerHeight - visualViewport.height > IOS_KEYBOARD_THRESHOLD_PX;

      if (keyboardOpen) {
        document.documentElement.style.setProperty("--safe-bottom", "0px");
        document.documentElement.classList.add("ios-keyboard-open");
        document.body.style.position = "fixed";
        document.body.style.top = "0";
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        document.body.style.height = `${Math.round(height)}px`;
        document.body.style.overflow = "hidden";
      } else {
        document.documentElement.style.setProperty(
          "--safe-bottom",
          "env(safe-area-inset-bottom)"
        );
        document.documentElement.classList.remove("ios-keyboard-open");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.height = "";
        document.body.style.overflow = "";
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
