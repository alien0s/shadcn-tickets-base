import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import type { DashboardTicketsData } from "../types";

type TicketVolumeCardProps = {
  data: DashboardTicketsData["ticketVolume"];
};

export function TicketVolumeCard({ data }: TicketVolumeCardProps) {
  // ✅ memo + proteção para evitar divisão por zero quando maxValue = 0
  const maxValue = useMemo(() => {
    let max = 0;

    for (const item of data.series) {
      if (item.created > max) max = item.created;
      if (item.solved > max) max = item.solved;
    }

    return max;
  }, [data.series]);

  const safeMax = maxValue > 0 ? maxValue : 1; // ✅ evita Infinity/NaN no cálculo de altura

  // ✅ mantém o texto igual, mas sem bug com negativos
  const changeLabel = `${data.change > 0 ? "+" : ""}${data.change}% semana contra semana`;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between p-6 md:p-4">
        <div>
          <CardDescription>{data.periodLabel}</CardDescription>
          <CardTitle className="text-2xl">Volume de tickets</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Criados x resolvidos com base na fila atual.
          </p>
        </div>

        <div
          className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 border border-emerald-100"
          aria-label={changeLabel} // ✅ a11y sem mudar UI
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">{changeLabel}</span>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-4 md:pb-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Ticket Solved</p>
            <p className="text-xl font-semibold">
              {data.solved.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Ticket Created</p>
            <p className="text-xl font-semibold">
              {data.created.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div
          className="flex items-end gap-3 h-44 md:h-36"
          role="img" // ✅ a11y: trata conjunto como gráfico
          aria-label="Gráfico de barras comparando tickets criados e resolvidos"
        >
          {data.series.map((item) => {
            // ✅ alturas determinísticas e seguras
            const createdHeight = Math.max(8, (item.created / safeMax) * 100);
            const solvedHeight = Math.max(8, (item.solved / safeMax) * 100);

            return (
              <div
                key={item.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full items-end gap-2 h-32 md:h-24">
                  <div
                    className="flex-1 rounded-md bg-emerald-500/80"
                    style={{ height: `${solvedHeight}%` }}
                    aria-hidden="true" // ✅ visual-only
                  />
                  <div
                    className="flex-1 rounded-md bg-primary/70"
                    style={{ height: `${createdHeight}%` }}
                    aria-hidden="true" // ✅ visual-only
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
