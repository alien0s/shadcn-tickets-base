import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  dateLabel: string; // ex: "12 Nov"
  entity?: string; // ex: "anra", "aceam"
};

type Props = {
  ticket: Ticket;
  onClick?: () => void;
  isActive?: boolean;
};

export function TicketListItem({ ticket, onClick, isActive = false }: Props) {
  const statusPill = getStatusPill(ticket.status);
  const priorityPill = getPriorityPill(ticket.priority);

  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 flex items-start gap-3 clean-shadow text-left focus:outline-none transition-colors ${isActive
        ? "bg-accent border-l-2 border-l-primary"
        : "hover:bg-accent/60 focus:bg-accent/60"
        }`}
    >
      {/* Avatar maior */}
      <Avatar className="h-9 w-9 rounded-md mt-[2px]">
        <AvatarFallback className="rounded-md">
          {ticket.subject.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium truncate">
            {ticket.subject}
          </span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {ticket.dateLabel}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-medium ${statusPill.className}`}
          >
            {statusPill.label}
          </span>
          <span
            className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-medium ${priorityPill.className}`}
          >
            {priorityPill.label}
          </span>
        </div>
      </div>
    </button>
  );
}

import { TICKET_STATUS_STYLES } from "@/config/ticket-constants";

function getStatusPill(status: TicketStatus) {
  const value = status.toLowerCase();

  if (value === "aberto" || value === "open") {
    return TICKET_STATUS_STYLES.aberto;
  }

  if (value === "pendente" || value === "pending") {
    return TICKET_STATUS_STYLES.pendente;
  }

  if (value === "fechado" || value === "closed") {
    return TICKET_STATUS_STYLES.fechado;
  }

  return {
    label: status,
    className: TICKET_STATUS_STYLES.default.className,
  };
}

function getPriorityPill(priority: TicketPriority) {
  const value = priority.toLowerCase();

  if (value === "baixa" || value === "low") {
    return {
      label: "Prioridade baixa",
      className:
        "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
    };
  }

  if (value === "media" || value === "medium") {
    return {
      label: "Prioridade média",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    };
  }

  if (value === "alta" || value === "high") {
    return {
      label: "Prioridade alta",
      className:
        "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    };
  }

  return {
    label: priority,
    className: "bg-muted text-muted-foreground",
  };
}

// opcional: default export, caso você queira
export default TicketListItem;
