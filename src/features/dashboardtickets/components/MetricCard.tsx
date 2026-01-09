import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Ticket } from "lucide-react";

type Metric = {
  label: string;
  value: number;
  icon: typeof Ticket;
  change: string;
  changeTone: "up" | "down";
  headline: string;
  body: string;
};

type MetricCardProps = {
  metric: Metric;
  delay?: number;
};

export function MetricCard({ metric, delay = 0 }: MetricCardProps) {
  const Icon = metric.icon;
  const ChangeIcon = metric.changeTone === "up" ? ArrowUpRight : ArrowDownRight;
  const changeToneClass =
    metric.changeTone === "up"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="p-6 pb-4 md:p-4 md:pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-lg bg-muted/80 p-2 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold",
              changeToneClass
            )}
          >
            <ChangeIcon className="h-3 w-3" />
            {metric.change}
          </span>
        </div>
        <CardTitle className="text-sm text-muted-foreground font-medium">
          {metric.label}
        </CardTitle>
        <div className="text-3xl font-bold tracking-tight">
          {metric.value.toLocaleString("pt-BR")}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-1.5 md:px-4 md:pb-4">
        <p className="text-sm font-semibold">{metric.headline}</p>
        <p className="text-sm text-muted-foreground">{metric.body}</p>
      </CardContent>
    </Card>
  );
}
