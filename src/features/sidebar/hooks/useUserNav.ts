import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/theme-context";
import type { UserNavState } from "../types";

export function useUserNav(): UserNavState {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  function onNavigateSettings() {
    navigate("/settings");
  }

  return { theme, setTheme, onNavigateSettings };
}
