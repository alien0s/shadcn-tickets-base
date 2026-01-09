export type TrendPoint = { label: string; value: number };
export type VolumePoint = { label: string; solved: number; created: number };
export type ChannelSlice = { label: string; value: number; color: string };

export type RecentTicket = {
  id: string;
  title: string;
  preview: string;
  date: string;
  status: string;
  priority: string;
  channel: string;
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
