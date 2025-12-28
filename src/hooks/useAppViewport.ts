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
      } else {
        document.documentElement.style.setProperty(
          "--safe-bottom",
          "env(safe-area-inset-bottom)"
        );
      }
    };

    updateVars();
    window.addEventListener("resize", updateVars);
    window.addEventListener("orientationchange", updateVars);

    if (visualViewport) {
      visualViewport.addEventListener("resize", updateVars);
      visualViewport.addEventListener("scroll", updateVars);
    }

    return () => {
      window.removeEventListener("resize", updateVars);
      window.removeEventListener("orientationchange", updateVars);

      if (visualViewport) {
        visualViewport.removeEventListener("resize", updateVars);
        visualViewport.removeEventListener("scroll", updateVars);
      }
    };
  }, []);
}
