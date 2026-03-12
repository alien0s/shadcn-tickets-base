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
const COOKIE_KEY = "supportdesk-theme";
const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * Valida string vinda do localStorage para não aceitar lixo.
 */
function normalizeStoredTheme(value: string | null): Theme {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";");

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part.startsWith(encodedName)) continue;
    return decodeURIComponent(part.slice(encodedName.length));
  }

  return null;
}

function resolveSharedCookieDomain(hostname: string): string | null {
  const normalized = hostname.toLowerCase();

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return null;
  }

  // Avoid setting Domain for IP-based hosts.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return null;
  }

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length < 2) return null;

  // Best-effort for common domains (example.com -> .example.com).
  return `.${parts.slice(-2).join(".")}`;
}

function writeThemeCookie(value: Exclude<Theme, "system">) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  const baseAttributes = `Path=/; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`;

  document.cookie = `${encodeURIComponent(COOKIE_KEY)}=${encodeURIComponent(value)}; ${baseAttributes}`;

  const sharedDomain = resolveSharedCookieDomain(window.location.hostname);
  if (sharedDomain) {
    document.cookie = `${encodeURIComponent(COOKIE_KEY)}=${encodeURIComponent(value)}; ${baseAttributes}; Domain=${sharedDomain}`;
  }
}

function clearThemeCookie() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  const expireAttributes = `Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;

  document.cookie = `${encodeURIComponent(COOKIE_KEY)}=; ${expireAttributes}`;

  const sharedDomain = resolveSharedCookieDomain(window.location.hostname);
  if (sharedDomain) {
    document.cookie = `${encodeURIComponent(COOKIE_KEY)}=; ${expireAttributes}; Domain=${sharedDomain}`;
  }
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

    const localTheme = window.localStorage.getItem(STORAGE_KEY);
    if (localTheme !== null) {
      return normalizeStoredTheme(localTheme);
    }

    return normalizeStoredTheme(getCookieValue(COOKIE_KEY));
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
      clearThemeCookie();
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
    writeThemeCookie(theme);
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
