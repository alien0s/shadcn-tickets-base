import { useMemo } from "react"; // ✅ evita recriar array a cada render (ref estável)
import { Clock3, MessageCircle, Ticket, Users } from "lucide-react";
import type { DashboardTicketsData } from "../types";
import { MetricCard } from "./MetricCard";
import { ReplyTimeCard } from "./ReplyTimeCard";
import { TicketVolumeCard } from "./TicketVolumeCard";
import type { LucideIcon } from "lucide-react";


type DashboardTicketsGridProps = {
  data: DashboardTicketsData;
};

type MetricItem = {
  label: string;
  value: number;
  icon: LucideIcon;

  change: string;
  changeTone: "up" | "down";
  headline: string;
  body: string;
};

export function DashboardTicketsGrid({ data }: DashboardTicketsGridProps) {
  // ✅ memo mantém referência estável (bom se MetricCard for memoizado)
  const metrics = useMemo<readonly MetricItem[]>(
    () => [
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
    ],
    [
      data.totals.allTickets, // ✅ dependências explícitas evitam stale values
      data.totals.clientReplies,
      data.totals.staffReplies,
      data.totals.withoutReply,
    ]
  );

  return (
    <div className="space-y-4 md:space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-2">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.label} // ✅ ok se label for único/estável (como está no mock)
            metric={metric}
            delay={index * 60} // ✅ cálculo simples; sem handlers inline
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2 md:gap-3">
        <ReplyTimeCard data={data.replyTime} />
        <TicketVolumeCard data={data.ticketVolume} />
      </div>
    </div>
  );
}
