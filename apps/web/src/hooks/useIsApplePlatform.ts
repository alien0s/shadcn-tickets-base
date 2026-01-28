import { useMemo } from "react";

/**
 * Hook que detecta se o usuário está em uma plataforma Apple
 * 
 * Identifica dispositivos:
 * - iOS: iPhone, iPad, iPod
 * - iPadOS: iPads modernos (iOS 13+)
 * - macOS: Macs desktop/laptop
 * 
 * @returns true se estiver em dispositivo Apple, false caso contrário
 * 
 * @example
 * const isApple = useIsApplePlatform();
 * if (isApple) {
 *   // Aplicar estilo/comportamento específico para Apple
 * }
 */
export const useIsApplePlatform = (): boolean =>
  useMemo(() => {
    // SSR-safe: retorna false no servidor
    if (typeof navigator === "undefined") {
      return false;
    }

    return (
      // Detecta dispositivos iOS tradicionais (iPhone, iPad, iPod)
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      
      // Detecta iPadOS 13+ (iPads que se identificam como Mac)
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      
      // Detecta macOS (desktop/laptop)
      /Mac/.test(navigator.platform)
    );
  }, []); // useMemo com [] é OK aqui: navigator nunca muda durante lifecycle