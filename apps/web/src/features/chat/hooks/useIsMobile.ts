import { useSyncExternalStore } from "react";

const MOBILE_MQL = "(max-width: 767px)"; // <-- fonte única da verdade

function getServerSnapshot() {
  return false; // SSR: previsível; evita tentar inferir viewport
}

function getSnapshot() {
  if (typeof window === "undefined") return false; // SSR safety
  return window.matchMedia(MOBILE_MQL).matches;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}; // SSR safety

  const mql = window.matchMedia(MOBILE_MQL);

  // Não depende do evento para manter compat/typing simples
  const handler = () => onStoreChange();

  if (mql.addEventListener) {
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }

  // Safari antigo
  mql.addListener(handler);
  return () => mql.removeListener(handler);
}

export function useIsMobile() {
  // Evita "flash" e inconsistência entre render/effect em React 18
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
