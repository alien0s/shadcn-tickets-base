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
  const maxValue = Math.max(
    ...data.series.flatMap((item) => [item.created, item.solved])
  );

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
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 border border-emerald-100">
          <ArrowUpRight className="h-4 w-4" />
          <span className="text-sm font-medium">
            +{data.change}% semana contra semana
          </span>
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

        <div className="flex items-end gap-3 h-44 md:h-36">
          {data.series.map((item) => {
            const createdHeight = Math.max(8, (item.created / maxValue) * 100);
            const solvedHeight = Math.max(8, (item.solved / maxValue) * 100);
            return (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end gap-2 h-32 md:h-24">
                  <div
                    className="flex-1 rounded-md bg-emerald-500/80"
                    style={{ height: `${solvedHeight}%` }}
                  />
                  <div
                    className="flex-1 rounded-md bg-primary/70"
                    style={{ height: `${createdHeight}%` }}
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
