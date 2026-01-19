import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

const STORAGE_KEY = "sidebar-collapsed";
const MD_BREAKPOINT = 768;

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

function isMobileViewport() {
  // "mobile/tablet" = abaixo do breakpoint md (768)
  if (typeof window === "undefined") return false;
  return window.innerWidth < MD_BREAKPOINT;
}

/**
 * Lê preferência do desktop.
 * - true/false se existir
 * - null se ainda não foi salva
 */
function readStoredCollapsed(): boolean | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored !== null ? stored === "true" : null;
}

/**
 * Estado inicial:
 * - mobile/tablet: SEMPRE fechado (true)
 * - desktop: usa preferência salva; se não existir, começa aberto (false)
 */
function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;

  if (isMobileViewport()) return true;

  return readStoredCollapsed() ?? false;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);

  // Ref pra evitar closure antiga dentro do listener do matchMedia
  const isCollapsedRef = useRef(isCollapsed);

  // Ref pra detectar transição desktop -> mobile e mobile -> desktop
  const wasMobileRef = useRef<boolean | null>(null);

  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dispara só quando cruza o breakpoint (melhor que resize)
    const mediaQuery = window.matchMedia(
      `(max-width: ${MD_BREAKPOINT - 1}px)`
    );

    wasMobileRef.current = mediaQuery.matches;

    const handleChange = () => {
      const isMobile = mediaQuery.matches;
      const wasMobile = wasMobileRef.current ?? isMobile;

      /**
       * DESKTOP -> MOBILE/TABLET:
       * regra do projeto = força fechar para não quebrar layout.
       * NÃO salva no localStorage (não estraga preferência do desktop).
       */
      if (isMobile && !wasMobile) {
        if (!isCollapsedRef.current) {
          setIsCollapsed(true);
        }
      }

      /**
       * MOBILE/TABLET -> DESKTOP:
       * restaura preferência salva do desktop.
       */
      if (!isMobile && wasMobile) {
        setIsCollapsed(readStoredCollapsed() ?? false);
      }

      wasMobileRef.current = isMobile;
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  /**
   * Toggle:
   * - mobile/tablet: abre/fecha, mas NÃO salva (não precisa preferência)
   * - desktop: abre/fecha e SALVA preferência
   */
  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;

      // Só persiste se for desktop
      if (typeof window !== "undefined" && !isMobileViewport()) {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }

      return next;
    });
  }, []);

  /**
   * Close:
   * - sempre fecha
   * - só salva se for desktop
   */
  const closeSidebar = useCallback(() => {
    setIsCollapsed(true);

    if (typeof window !== "undefined" && !isMobileViewport()) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  }, []);

  // Memo pra evitar re-render em cascata por objeto novo
  const value = useMemo(
    () => ({ isCollapsed, toggleSidebar, closeSidebar }),
    [isCollapsed, toggleSidebar, closeSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
