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
  isHighlighting?: boolean;
  isFadingHighlight?: boolean;
  typingPreview?: string;
};

export function TicketListItem({
  ticket,
  onClick,
  isActive = false,
  isHighlighting = false,
  isFadingHighlight = false,
  typingPreview,
}: Props) {
  const typeKey = ticket.type as TicketTypeKey | undefined;
  const typeStyle = typeKey ? TICKET_TYPE_STYLES[typeKey] : undefined;
  const TypeIcon = typeStyle?.icon ?? null;
  const unreadCount = ticket.unreadCount ?? 0;

  const fallbackInitial =
    (ticket.requester || ticket.subject || "").trim().charAt(0).toUpperCase() || "?";
  const isTyping = Boolean(typingPreview && typingPreview.trim().length > 0);
  const previewText = typingPreview && typingPreview.trim().length > 0
    ? typingPreview
    : (ticket.title ?? ticket.subject);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "w-full min-w-0 px-3 py-2 flex items-start gap-3 clean-shadow text-left focus:outline-none transition-colors",
        isActive
          ? "bg-accent border-l-2 border-l-primary"
          : "hover:bg-accent/60 focus:bg-accent/60",
        !isActive && isHighlighting && !isFadingHighlight && "ticket-new-pulse",
        !isActive && isHighlighting && isFadingHighlight && "ticket-new-fade"
      )}
      title={ticket.subject}
    >
      <Avatar className="h-10 w-10 rounded-lg mt-[2px] bg-muted/70">
        <AvatarImage src={ticket.avatarUrl} alt={ticket.requester || "Solicitante"} />
        <AvatarFallback className="rounded-lg text-xs font-semibold">
          {fallbackInitial}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium truncate">
            {ticket.requester || "Sem nome"}
          </span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
            {ticket.dateLabel}
          </span>
        </div>

        <div className="mb-1 flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-xs block overflow-hidden whitespace-nowrap text-ellipsis max-w-full min-w-0",
              isTyping ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            {previewText}
          </span>

          {unreadCount > 0 && (
            <span
              className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-semibold flex-shrink-0"
              aria-label={`${unreadCount} mensagens nao lidas`}
              title={`${unreadCount} mensagens nao lidas`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <StatusPill status={ticket.status} />
            <PriorityPill priority={ticket.priority} />

            {TypeIcon && (
              <span
                className="inline-flex items-center justify-center h-5 w-5 rounded-md border border-border text-muted-foreground bg-transparent"
                title={typeStyle?.label ?? String(ticket.type)}
                aria-label={typeStyle?.label ?? "Tipo do ticket"}
              >
                <TypeIcon className="h-3 w-3" aria-hidden="true" />
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
