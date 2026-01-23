import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/theme-context";
import type { UserNavState } from "../types";

export function useUserNav(): UserNavState {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // ✅ handler estável (evita re-render desnecessário em UserNav memoizado no futuro)
  const onNavigateSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  return {
    theme,
    setTheme, // mantém direto: hook de contexto já deve ser estável
    onNavigateSettings,
  };
}
