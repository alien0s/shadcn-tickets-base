export type SettingsSectionId = "general" | "security" | "appearance";

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
};

export type ProfileSectionProps = {
  entities: string[];
  selectedEntity: string;
  onChangeEntity: (val: string) => void;
};

export type SecuritySectionProps = {
  twoFactorEnabled: boolean;
  onToggleTwoFactor: (val: boolean) => void;
};

import type { ReactNode } from "react";

export type ProfileFieldProps = {
  title: string;
  description?: string;
  children: ReactNode;
  align?: "start" | "center";
};

export type EntitySelectProps = {
  options: string[];
  value: string;
  onChange: (val: string) => void;
};
