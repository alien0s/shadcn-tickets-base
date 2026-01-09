import { useState } from "react";
import type { SettingsSection, SettingsSectionId } from "../types";

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", label: "Perfil" },
  { id: "security", label: "Segurança" },
  { id: "appearance", label: "Aparência" },
];

export function useSettingsSections() {
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("general");

  return {
    activeSection,
    sections: SETTINGS_SECTIONS,
    setActiveSection,
  };
}
