import { useMemo } from "react";

export const useIsApplePlatform = () =>
  useMemo(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      /Mac/.test(navigator.platform)
    );
  }, []);
