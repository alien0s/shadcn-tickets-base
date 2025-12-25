import { TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "./TicketListItem";

export type CanonicalStatus = "aberto" | "pendente" | "fechado";

type StatusVariantKey = CanonicalStatus | "default";

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

export function getStatusVariant(status: TicketStatus) {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    return {
      key: "default" as StatusVariantKey,
      label: status,
      icon: TICKET_STATUS_STYLES.default.icon,
      className: TICKET_STATUS_STYLES.default.className,
    };
  }

  const variant = TICKET_STATUS_STYLES[normalized];
  return {
    key: normalized,
    label: variant.label,
    icon: variant.icon,
    className: variant.className,
  };
}

export function StatusPill({ status, className }: { status: TicketStatus; className?: string }) {
  const variant = getStatusVariant(status);
  const Icon = variant.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-1.5 py-0.5 rounded-md text-[11px] font-medium border",
        variant.className,
        className
      )}
    >
      <Icon className="h-3 w-3 mr-1.5" />
      {variant.label}
    </span>
  );
}
