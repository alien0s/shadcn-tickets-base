// String ISO (API-friendly). UI converte/formatta quando necessário.
export type ISODateString = string;

export type TrendPoint = { label: string; value: number };
export type VolumePoint = { label: string; solved: number; created: number };

/**
 * Slice por canal.
 * ⚠️ `color` é UI-only (token CSS). Em API real, prefira `colorKey` e mapeie no front.
 */
export type ChannelSlice = { label: string; value: number; color: string };

/**
 * Status/priority/channel como unions mantém previsível e evita strings arbitrárias.
 * Se sua API real tiver outros valores, é só expandir aqui.
 */
export type TicketStatus = "open" | "pending" | "solved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketChannel = "email" | "messenger" | "live_chat" | "form" | "other";

export type RecentTicket = {
  id: string;
  title: string;
  preview: string;

  // API-ready: ideal receber ISO (ex: "2026-01-18T10:30:00Z").
  // Se hoje você usa "10:30" ou "Nov 20", ainda é string, mas mantenha consistente.
  date: ISODateString;

  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;

  // Tags pontuais de UI/estado (já está bem definido)
  tag?: "overdue" | "sla" | "open";
};

export type DashboardTicketsData = {
  totals: {
    allTickets: number;
    clientReplies: number;
    staffReplies: number;
    withoutReply: number;
  };

  replyTime: {
    averageMinutes: number;
    weekChange: number;
    highlight: TrendPoint;
    points: TrendPoint[];
  };

  priorityByChannel: {
    totalActive: number;
    distribution: ChannelSlice[];
  };

  ticketVolume: {
    solved: number;
    created: number;
    periodLabel: string;
    change: number;
    series: VolumePoint[];
  };

  recentTickets: RecentTicket[];
};
