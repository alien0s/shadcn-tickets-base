import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TICKET_TYPE_STYLES, type TicketTypeKey } from "@/config/ticket-constants";
import { StatusPill } from "./StatusPill";
import { PriorityPill } from "./PriorityPill";
import type { Ticket } from "../types/ticketTypes";
import { cn } from "@/lib/utils";

type Props = {
  ticket: Ticket;
  onClick?: () => void;
  isActive?: boolean;
};

export function TicketListItem({ ticket, onClick, isActive = false }: Props) {
  // ✅ SSR/Api-safe: evita crash se vier type inesperado
  const typeKey = ticket.type as TicketTypeKey | undefined;
  const typeStyle = typeKey ? TICKET_TYPE_STYLES[typeKey] : undefined;
  const TypeIcon = typeStyle?.icon ?? null;

  const fallbackInitial =
    (ticket.requester || ticket.subject || "").trim().charAt(0).toUpperCase() || "?";

  return (
    <button
      type="button" // ✅ evita submit acidental se este item cair dentro de algum <form> no futuro
      onClick={onClick}
      aria-current={isActive ? "true" : undefined} // ✅ ajuda leitores de tela para item ativo
      className={cn(
        "w-full px-3 py-2 flex items-start gap-3 clean-shadow text-left focus:outline-none transition-colors",
        isActive
          ? "bg-accent border-l-2 border-l-primary"
          : "hover:bg-accent/60 focus:bg-accent/60"
      )}
      title={ticket.subject} // ✅ tooltip útil sem mudar UI
    >
      {/* Avatar maior */}
      <Avatar className="h-10 w-10 rounded-lg mt-[2px] bg-muted/70">
        <AvatarImage
          src={ticket.avatarUrl}
          alt={ticket.requester || "Solicitante"}
        />
        
        <AvatarFallback className="rounded-lg text-xs font-semibold">
          {fallbackInitial}
        </AvatarFallback>
      </Avatar>

      {/* Conteudo principal */}
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
          <StatusPill status={ticket.status} />
          <PriorityPill priority={ticket.priority} />

          {/* Icon Type Next to Priority */}
          {TypeIcon && (
            <span
              className="inline-flex items-center justify-center h-5 w-5 rounded-md border border-border text-muted-foreground bg-transparent"
              title={typeStyle?.label ?? String(ticket.type)} // ✅ title mais amigável
              aria-label={typeStyle?.label ?? "Tipo do ticket"}
            >
              <TypeIcon className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
