import type { ShiftEvent, ShiftKey } from "../types";

export const SHIFT_TIMES: Record<ShiftKey, readonly string[]> = {
  M: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"],
  V: ["13:00", "14:00", "15:00", "16:00", "17:00"],
};

export const TURMAS = [
  "1º ano A (EM)",
  "2º ano B (EF2)",
  "3º ano C (EF2)",
] as const;

export const ESCOLAS = [
  "Escola Municipal Centro",
  "Escola Estadual Norte",
  "Colegio Modelo Sul",
] as const;

export const PROFESSORES = ["Ana Souza", "Carlos Lima"] as const;
export const PROFESSOR_AVATARS: Record<string, string> = {
  "Ana Souza": "https://api.dicebear.com/9.x/lorelei/svg?seed=Ana%20Souza",
  "Carlos Lima": "https://api.dicebear.com/9.x/lorelei/svg?seed=Carlos%20Lima",
};
export const MATERIAS = ["Selecionar", "História", "Matemática", "Português"] as const;

export const MOCK_TURNOS_EVENTS: ShiftEvent[] = [
  {
    id: "m-ter-07",
    shift: "M",
    day: "ter",
    time: "07:00",
    className: "1º ano A (EM)",
    subject: "História",
  },
  {
    id: "m-seg-10",
    shift: "M",
    day: "seg",
    time: "10:00",
    className: "1º ano A (EM)",
    subject: "História",
  },
  {
    id: "m-qui-10",
    shift: "M",
    day: "qui",
    time: "10:00",
    className: "1º ano A (EM)",
    subject: "História",
  },
  {
    id: "v-qua-15",
    shift: "V",
    day: "qua",
    time: "15:00",
    className: "2º ano B (EF2)",
    subject: "Matemática",
  },
];

