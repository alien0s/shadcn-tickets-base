import type { DashboardTicketsData } from "../types";

export const MOCK_DASHBOARD_TICKETS_DATA: DashboardTicketsData = {
  totals: {
    allTickets: 2300,
    clientReplies: 112,
    staffReplies: 1678,
    withoutReply: 94,
  },
  replyTime: {
    averageMinutes: 1679,
    weekChange: -8,
    highlight: { label: "05 Fev 2024", value: 400 },
    points: [
      { label: "01 Fev", value: 1180 },
      { label: "02 Fev", value: 1340 },
      { label: "03 Fev", value: 940 },
      { label: "04 Fev", value: 1280 },
      { label: "05 Fev", value: 1430 },
      { label: "06 Fev", value: 980 },
      { label: "07 Fev", value: 1679 },
    ],
  },
  priorityByChannel: {
    totalActive: 1500,
    distribution: [
      { label: "Email", value: 620, color: "hsl(var(--chart-2))" },
      { label: "Messenger", value: 340, color: "hsl(var(--chart-4))" },
      { label: "Live chat", value: 280, color: "hsl(var(--primary))" },
      { label: "Formulario", value: 260, color: "hsl(var(--chart-1))" },
    ],
  },
  ticketVolume: {
    solved: 1654,
    created: 4567,
    periodLabel: "Ultimos 7 dias",
    change: 12,
    series: [
      { label: "Nov 20", created: 2400, solved: 1400 },
      { label: "Nov 21", created: 1900, solved: 1200 },
      { label: "Nov 22", created: 2150, solved: 900 },
      { label: "Nov 23", created: 2500, solved: 1350 },
      { label: "Nov 24", created: 2100, solved: 1180 },
      { label: "Nov 25", created: 2200, solved: 980 },
      { label: "Nov 26", created: 2300, solved: 1250 },
    ],
  },
  recentTickets: [],
};
