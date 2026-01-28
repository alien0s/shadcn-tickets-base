import type { ReactNode } from "react";

// Ids das seções (fonte de verdade)
export type SettingsSectionId = "general" | "security" | "appearance";

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
};

export type ProfileSectionProps = {
  // ✅ aceitar readonly evita mismatch ao passar arrays constantes
  entities: readonly string[];
  selectedEntity: string;
  onChangeEntity: (val: string) => void;
};

export type SecuritySectionProps = {
  twoFactorEnabled: boolean;

  // ✅ API-ready: permite handler async (ex: chamar backend) sem quebrar componentes
  onToggleTwoFactor: (val: boolean) => void | Promise<void>;
};

export type ProfileFieldProps = {
  title: string;
  description?: string;
  children: ReactNode;

  // ✅ alinhamento opcional (mesmo se o componente ignorar por enquanto)
  align?: "start" | "center";
};

export type EntitySelectProps = {
  // ✅ aceitar readonly pelo mesmo motivo (arrays constantes)
  options: readonly string[];
  value: string;
  onChange: (val: string) => void;
};
