import { Clock3, MessageCircle, Ticket, Users } from "lucide-react";
import type { DashboardTicketsData } from "../types";
import { MetricCard } from "./MetricCard";
import { ReplyTimeCard } from "./ReplyTimeCard";
import { TicketVolumeCard } from "./TicketVolumeCard";

type DashboardTicketsGridProps = {
  data: DashboardTicketsData;
};

export function DashboardTicketsGrid({ data }: DashboardTicketsGridProps) {
  const metrics = [
    {
      label: "Todos os tickets",
      value: data.totals.allTickets,
      icon: Ticket,
      change: "+12.5%",
      changeTone: "up",
      headline: "Fila cresceu este mes",
      body: "Volume acumulado dos ultimos 6 meses",
    },
    {
      label: "Respostas de clientes",
      value: data.totals.clientReplies,
      icon: Users,
      change: "-20%",
      changeTone: "down",
      headline: "Atencao em follow-ups",
      body: "Clientes aguardam respostas pendentes",
    },
    {
      label: "Respostas da equipe",
      value: data.totals.staffReplies,
      icon: MessageCircle,
      change: "+12.5%",
      changeTone: "up",
      headline: "Colaboracao em alta",
      body: "Equipe manteve engajamento elevado",
    },
    {
      label: "Sem resposta",
      value: data.totals.withoutReply,
      icon: Clock3,
      change: "+4.5%",
      changeTone: "up",
      headline: "Precisa de atencao rapida",
      body: "Tire estes tickets da fila primeiro",
    },
  ] as const;

  return (
    <div className="space-y-4 md:space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-2">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} delay={index * 60} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2 md:gap-3">
        <ReplyTimeCard data={data.replyTime} />
        <TicketVolumeCard data={data.ticketVolume} />
      </div>
    </div>
  );
}
