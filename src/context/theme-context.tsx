import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "theme";

/**
 * Valida string vinda do localStorage para não aceitar lixo.
 */
function normalizeStoredTheme(value: string | null): Theme {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

/**
 * Aplica tema no <html>.
 * Padrão Tailwind/shadcn: usar apenas a classe "dark".
 * - dark => <html class="dark">
 * - light => <html> sem classe dark
 */
function applyResolvedTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return normalizeStoredTheme(window.localStorage.getItem(STORAGE_KEY));
  });

  /**
   * Setter estável para o app inteiro.
   * Aqui é só um wrapper pra manter referência estável e permitir regras futuras.
   */
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  /**
   * Aplica o tema no DOM.
   * - Se theme = system: segue o SO e escuta mudanças.
   * - Se theme = light/dark: aplica fixo e não precisa de listener.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveSystemTheme = () =>
      mediaQuery.matches ? "dark" : "light";

    const handleSystemChange = () => {
      applyResolvedTheme(resolveSystemTheme());
    };

    if (theme === "system") {
      // aplica baseado no sistema
      applyResolvedTheme(resolveSystemTheme());

      // escuta mudanças do sistema
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleSystemChange);
      } else {
        mediaQuery.addListener(handleSystemChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleSystemChange);
        } else {
          mediaQuery.removeListener(handleSystemChange);
        }
      };
    }

    // tema fixo
    applyResolvedTheme(theme);
  }, [theme]);

  /**
   * Persistência:
   * - Se usuário escolhe "system", podemos remover do storage (fica "sem preferência").
   * - Se escolhe light/dark, salvamos.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (theme === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  /**
   * Memo evita recriar o objeto do value em toda render.
   * Menos renders desnecessários em quem consome o context.
   */
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
