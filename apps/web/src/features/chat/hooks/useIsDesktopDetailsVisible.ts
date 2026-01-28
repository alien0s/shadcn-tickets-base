import { useSyncExternalStore } from "react";

const DESKTOP_DETAILS_MQL = "(min-width: 1280px)"; // <-- fonte única da verdade

function getServerSnapshot() {
  return false; // SSR: não existe viewport; escolha previsível
}

function getSnapshot() {
  // SSR safety: garante que não acessa window no servidor
  if (typeof window === "undefined") return false;
  return window.matchMedia(DESKTOP_DETAILS_MQL).matches;
}

function subscribe(onStoreChange: () => void) {
  // SSR safety: no server não há nada para assinar
  if (typeof window === "undefined") return () => {};

  const mql = window.matchMedia(DESKTOP_DETAILS_MQL);

  // Listener sem depender do event (evita tipagem/compat e mantém simples)
  const handler = () => onStoreChange();

  // Compat: Safari antigo usa addListener/removeListener
  if (mql.addEventListener) {
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }

  mql.addListener(handler);
  return () => mql.removeListener(handler);
}

export function useIsDesktopDetailsVisible() {
  // useSyncExternalStore evita inconsistências entre render e efeitos em React 18
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
