import type { LucideIcon } from "lucide-react";
import { TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "../types/ticketTypes";
import { normalizeStatus, type CanonicalStatus } from "../utils/status";

type StatusVariantKey = CanonicalStatus | "default";

type StatusVariant = {
  key: StatusVariantKey;
  label: string;
  icon: LucideIcon; // ✅ evita JSX namespace e combina com lucide
  className: string;
};

export function getStatusVariant(status: TicketStatus): StatusVariant {
  const normalized = normalizeStatus(status);

  if (!normalized) {
    const fallback = TICKET_STATUS_STYLES.default;
    return {
      key: "default",
      label: status,
      icon: fallback.icon,
      className: fallback.className,
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

type StatusPillProps = {
  status: TicketStatus;
  className?: string;
};

export function StatusPill({ status, className }: StatusPillProps) {
  const variant = getStatusVariant(status);
  const Icon = variant.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-1.5 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap leading-none",
        variant.className,
        className
      )}
    >
      <Icon className="h-3 w-3 mr-1.5" aria-hidden="true" />
      {variant.label}
    </span>
  );
}
