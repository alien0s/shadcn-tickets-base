import type { ComponentPropsWithoutRef } from "react";
import { HelpCircle } from "lucide-react";
import {
  TICKET_PRIORITY_STYLES,
  type TicketPriorityKey,
} from "@/config/ticket-constants";
import type { TicketPriority } from "../types/ticketTypes";
import { cn } from "@/lib/utils";

type BaseProps = {
  priority: TicketPriority | TicketPriorityKey;
  isSelected?: boolean;
  size?: "xs" | "sm";
  useStyle?: boolean;
  showSelectedRing?: boolean;
  className?: string;
};

// ✅ quando tem onClick => button
type ButtonLikeProps = BaseProps &
  Omit<ComponentPropsWithoutRef<"button">, "type" | "className"> & {
    onClick: NonNullable<ComponentPropsWithoutRef<"button">["onClick"]>;
  };

// ✅ quando NÃO tem onClick => span
type SpanLikeProps = BaseProps &
  Omit<ComponentPropsWithoutRef<"span">, "className"> & {
    onClick?: undefined;
  };

export type PriorityPillProps = ButtonLikeProps | SpanLikeProps;

const PRIORITY_MAP: Record<string, TicketPriorityKey> = {
  baixa: "baixa",
  low: "baixa",
  media: "media",
  medium: "media",
  alta: "alta",
  high: "alta",
};

function resolvePriorityKey(
  priority: TicketPriority | TicketPriorityKey
): TicketPriorityKey | null {
  const key = PRIORITY_MAP[String(priority).toLowerCase()];
  return key ?? null;
}

export function PriorityPill(props: PriorityPillProps) {
  const key = resolvePriorityKey(props.priority);
  const style = key ? TICKET_PRIORITY_STYLES[key] : null;
  const Icon = style?.icon ?? HelpCircle;

  const size = props.size ?? "xs";
  const isSelected = props.isSelected ?? false;
  const useStyle = props.useStyle ?? true;
  const showSelectedRing = props.showSelectedRing ?? true;

  const baseClassName = cn(
    // ✅ nowrap/leading evita “ícone em cima + texto embaixo” quando o layout aperta
    "inline-flex items-center gap-1 rounded-md border font-medium whitespace-nowrap leading-none",
    size === "sm" ? "px-3 py-1 text-xs" : "h-5 px-1.5 py-1 text-[11px]",
    useStyle
      ? style?.className ?? "bg-muted text-muted-foreground border-border"
      : "bg-transparent text-muted-foreground border-border",
    props.className
  );

  // ✅ botão (seleção no NewTicketDialog)
  if ("onClick" in props && typeof props.onClick === "function") {
    const {
      priority: _priority, // remove do spread no DOM
      isSelected: _isSelected,
      size: _size,
      useStyle: _useStyle,
      showSelectedRing: _showSelectedRing,
      className: _className,
      onClick,
      ...buttonProps // ✅ só props nativas do button
    } = props;

    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        className={cn(
          baseClassName,
          "transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isSelected && showSelectedRing && "ring-1 ring-current/30"
        )}
        {...buttonProps}
      >
        <Icon
          className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-3 w-3")}
          aria-hidden="true"
        />
        <span>{style?.label ?? props.priority}</span>
      </button>
    );
  }

  // ✅ span (lista de tickets)
  const {
    priority: _priority,
    isSelected: _isSelected,
    size: _size,
    useStyle: _useStyle,
    showSelectedRing: _showSelectedRing,
    className: _className,
    ...spanProps // ✅ só props nativas do span
  } = props;

  return (
    <span className={baseClassName} {...spanProps}>
      <Icon
        className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-3 w-3")}
        aria-hidden="true"
      />
      <span>{style?.label ?? props.priority}</span>
    </span>
  );
}
