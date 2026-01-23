import { useCallback, useMemo, useState } from "react";
import type { SettingsSection, SettingsSectionId } from "../types";

// ✅ fonte única de verdade das seções
const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: "general", label: "Perfil" },
  { id: "security", label: "Segurança" },
  { id: "appearance", label: "Aparência" },
];

export function useSettingsSections() {
  const [activeSection, setActiveSectionState] =
    useState<SettingsSectionId>("general");

  // ✅ ids válidos (API-ready, evita estados inválidos no futuro)
  const validSectionIds = useMemo(
    () => new Set(SETTINGS_SECTIONS.map((s) => s.id)),
    []
  );

  // ✅ setter previsível: só aceita ids conhecidos
  const setActiveSection = useCallback(
    (next: SettingsSectionId) => {
      if (!validSectionIds.has(next)) return;
      setActiveSectionState(next);
    },
    [validSectionIds]
  );

  return {
    activeSection,
    sections: SETTINGS_SECTIONS, // constante, não recriada
    setActiveSection,
  };
}
