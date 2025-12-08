import { Bug, Lightbulb, HelpCircle, Circle, Clock, CheckCircle2, ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

export const TICKET_STATUS_STYLES = {
    aberto: {
        label: "Aberto",
        icon: Circle,
        className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
    },
    pendente: {
        label: "Pendente",
        icon: Clock,
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    fechado: {
        label: "Fechado",
        icon: CheckCircle2,
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    // Fallback/Generic
    default: {
        label: "Desconhecido",
        icon: HelpCircle,
        className: "bg-muted text-muted-foreground",
    },
} as const;

export const TICKET_PRIORITY_STYLES = {
    baixa: {
        label: "Baixa",
        icon: ArrowDown,
        className: "bg-[hsl(var(--priority-low)/0.15)] text-[hsl(var(--priority-low))] border-[hsl(var(--priority-low)/0.2)]",
    },
    media: {
        label: "Média",
        icon: ArrowRight,
        className: "bg-[hsl(var(--priority-medium)/0.15)] text-[hsl(var(--priority-medium))] border-[hsl(var(--priority-medium)/0.2)]",
    },
    alta: {
        label: "Alta",
        icon: ArrowUp,
        className: "bg-[hsl(var(--priority-high)/0.15)] text-[hsl(var(--priority-high))] border-[hsl(var(--priority-high)/0.2)]",
    },
} as const;

export const TICKET_TYPE_STYLES = {
    erro: {
        label: "Erro",
        icon: Bug,
        className: "text-red-600 dark:text-red-400",
        activeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    },
    sugestao: {
        label: "Sugestão",
        icon: Lightbulb,
        className: "text-amber-600 dark:text-amber-400",
        activeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    },
    duvida: {
        label: "Dúvida",
        icon: HelpCircle,
        className: "text-blue-600 dark:text-blue-400",
        activeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    },
} as const;

export type TicketPriorityKey = keyof typeof TICKET_PRIORITY_STYLES;
export type TicketStatusKey = keyof typeof TICKET_STATUS_STYLES;
export type TicketTypeKey = keyof typeof TICKET_TYPE_STYLES;
