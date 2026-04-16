import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Atom,
  BookOpenText,
  Calculator,
  Dumbbell,
  Earth,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  MicVocal,
  Music4,
  Palette,
  Scale,
  ScrollText,
  Shapes,
  Users,
} from "lucide-react";

type SubjectIconResolver = {
  keywords: string[];
  icon: LucideIcon;
};

const SUBJECT_ICON_MAP: SubjectIconResolver[] = [
  { keywords: ["portugues", "língua portuguesa", "lingua portuguesa", "leitura", "redação", "redacao"], icon: BookOpenText },
  { keywords: ["matematica", "matemática", "algebra", "geometria"], icon: Calculator },
  { keywords: ["historia", "história"], icon: ScrollText },
  { keywords: ["geografia", "geografia humana"], icon: Earth },
  { keywords: ["ciencias", "ciências", "biologia"], icon: FlaskConical },
  { keywords: ["fisica", "física"], icon: Atom },
  { keywords: ["quimica", "química"], icon: FlaskConical },
  { keywords: ["ingles", "inglês", "espanhol", "idioma", "lingua inglesa", "língua inglesa"], icon: Languages },
  { keywords: ["arte", "artes", "artes visuais"], icon: Palette },
  { keywords: ["musica", "música"], icon: Music4 },
  { keywords: ["educacao fisica", "educação física", "ed. fisica", "ed. física"], icon: Dumbbell },
  { keywords: ["historia/geografia", "história/geografia"], icon: Globe },
  { keywords: ["filosofia", "sociologia"], icon: Users },
  { keywords: ["ensino religioso", "religiao", "religião"], icon: Landmark },
  { keywords: ["direito", "cidadania"], icon: Scale },
  { keywords: ["projeto", "projeto de vida"], icon: Shapes },
];

function normalizeSubjectName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Resolve um ícone Lucide a partir do nome da matéria.
 * Mantém a regra em um único ponto compartilhado para grade, matriz e demais features.
 */
export function getSubjectIcon(subjectName: string | null | undefined): LucideIcon {
  const normalizedName = normalizeSubjectName(String(subjectName ?? ""));

  const matched = SUBJECT_ICON_MAP.find((entry) =>
    entry.keywords.some((keyword) => normalizedName.includes(normalizeSubjectName(keyword)))
  );

  return matched?.icon ?? MicVocal;
}

/**
 * Resolve o ícone salvo pelo admin via nome do export do lucide-react.
 * Se o nome não existir, retorna null para o caller decidir o fallback.
 */
export function getLucideIconByName(iconName: string | null | undefined): LucideIcon | null {
  const normalizedName = String(iconName ?? "").trim();
  if (!normalizedName) return null;

  const candidate = LucideIcons[normalizedName as keyof typeof LucideIcons];
  if (!candidate) return null;

  return (typeof candidate === "function" || typeof candidate === "object")
    ? (candidate as LucideIcon)
    : null;
}
