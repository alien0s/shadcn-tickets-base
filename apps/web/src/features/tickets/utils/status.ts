import type { TicketStatus } from "../types/ticketTypes";

export type CanonicalStatus = "aberto" | "pendente" | "fechado";

const STATUS_ALIASES: Record<string, CanonicalStatus> = {
  aberto: "aberto",
  open: "aberto",
  pendente: "pendente",
  pending: "pendente",
  fechado: "fechado",
  closed: "fechado",
};

export function normalizeStatus(status: TicketStatus): CanonicalStatus | null {
  const key = STATUS_ALIASES[status.toLowerCase()];
  return key ?? null;
}
