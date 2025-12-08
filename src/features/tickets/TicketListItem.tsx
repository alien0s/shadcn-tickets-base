import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type TicketTypeKey, TICKET_STATUS_STYLES, TICKET_PRIORITY_STYLES, TICKET_TYPE_STYLES } from "@/config/ticket-constants";
import { HelpCircle } from "lucide-react";

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
  type?: TicketTypeKey;
  requester?: string; // Nome do solicitante
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
  const TypeIcon = ticket.type ? TICKET_TYPE_STYLES[ticket.type].icon : null;

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
            {ticket.requester || "Sem nome"}
          </span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
            {ticket.dateLabel}
          </span>
        </div>

        <span className="text-xs text-muted-foreground truncate mb-1 block">
          {ticket.subject}
        </span>

        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center h-5 px-1.5 py-0.5 rounded-md text-[11px] font-medium border border-transparent ${statusPill.className}`}
          >
            <statusPill.icon className="h-3 w-3 mr-1.5" />
            {statusPill.label}
          </span>
          <span
            className={`inline-flex items-center h-5 px-1.5 py-0.5 rounded-md text-[11px] font-medium border ${priorityPill.className}`}
          >
            <priorityPill.icon className="h-3 w-3 mr-1.5" />
            {priorityPill.label}
          </span>

          {/* Icon Type Next to Priority */}
          {TypeIcon && (
            <span
              className="inline-flex items-center justify-center h-5 w-5 rounded-md border border-border text-muted-foreground bg-transparent"
              title={ticket.type}
            >
              <TypeIcon className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

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
    icon: TICKET_STATUS_STYLES.default.icon,
    className: TICKET_STATUS_STYLES.default.className,
  };
}

function getPriorityPill(priority: TicketPriority) {
  const value = priority.toLowerCase();

  if (value === "baixa" || value === "low") {
    return TICKET_PRIORITY_STYLES.baixa;
  }

  if (value === "media" || value === "medium") {
    return TICKET_PRIORITY_STYLES.media;
  }

  if (value === "alta" || value === "high") {
    return TICKET_PRIORITY_STYLES.alta;
  }

  return {
    label: priority,
    icon: HelpCircle,
    className: "bg-muted text-muted-foreground",
  };
}

export default TicketListItem;
