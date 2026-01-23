import { useEffect } from "react";

/**
 * Detecta se o dispositivo é iOS (iPhone, iPad, iPod)
 * Inclui detecção de iPads com iPadOS 13+ que se identificam como Mac
 * 
 * @returns true se for dispositivo iOS, false caso contrário
 */
const isIOSDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

/**
 * Hook que ajusta a altura da aplicação para lidar com a barra de endereço mobile
 * 
 * Define a variável CSS `--app-height` com a altura real do viewport,
 * descontando barras de navegação e interface do navegador.
 * 
 * @important Não funciona em dispositivos iOS (incompatibilidade com visualViewport API)
 * 
 * @usage
 * // No componente raiz da aplicação
 * useAppViewport();
 * 
 * // No CSS
 * .app-container {
 *   height: 100vh; // fallback
 *   height: var(--app-height, 100vh); // valor dinâmico
 * }
 */
export function useAppViewport() {
  useEffect(() => {
    // Verifica se está no ambiente do navegador
    if (typeof window === "undefined") return;

    // iOS não suporta visualViewport API de forma consistente
    if (isIOSDevice()) return;

    const visualViewport = window.visualViewport;

    // Atualiza a variável CSS com a altura real do viewport
    const updateVars = () => {
      if (!visualViewport) return;
      
      // Define --app-height no root do documento
      document.documentElement.style.setProperty(
        "--app-height",
        `${Number(visualViewport.height.toFixed(1))}px`
      );
    };

    // Agenda atualização usando requestAnimationFrame para performance
    const scheduleUpdate = () => {
      requestAnimationFrame(updateVars);
    };

    // Executa atualização inicial
    scheduleUpdate();

    // Listeners para eventos que podem alterar a altura do viewport
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    if (visualViewport) {
      // Eventos específicos do visualViewport (mobile)
      visualViewport.addEventListener("resize", scheduleUpdate);
      visualViewport.addEventListener("scroll", scheduleUpdate);
    }

    // Cleanup: remove todos os event listeners
    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);

      if (visualViewport) {
        visualViewport.removeEventListener("resize", scheduleUpdate);
        visualViewport.removeEventListener("scroll", scheduleUpdate);
      }
    };
  }, []); // Effect roda apenas uma vez no mount
}