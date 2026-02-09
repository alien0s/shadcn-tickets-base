import type { TicketTypeKey } from "@/config/ticket-constants";

export type TicketStatus =
  | "aberto"
  | "pendente"
  | "fechado"
  | "open"
  | "pending"
  | "closed";

export type TicketPriority =
  | "baixa"
  | "media"
  | "alta"
  | "low"
  | "medium"
  | "high";

export type Ticket = {
  id: string;
  title?: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  avatarUrl?: string;
  type?: TicketTypeKey;
  requester?: string;
  dateLabel: string;
  entity?: string;
  unreadCount?: number;
};
