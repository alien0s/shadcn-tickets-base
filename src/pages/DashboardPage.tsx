import { useEffect, useMemo, useState } from "react";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { Sidebar } from "@/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  MessageCircle,
  PanelRight,
  RefreshCcw,
  Ticket,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardData = {
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

type TrendPoint = { label: string; value: number };
type VolumePoint = { label: string; solved: number; created: number };
type ChannelSlice = { label: string; value: number; color: string };
type RecentTicket = {
  id: string;
  title: string;
  preview: string;
  date: string;
  status: string;
  priority: string;
  channel: string;
  tag?: "overdue" | "sla" | "open";
};

const MOCK_DASHBOARD_DATA: DashboardData = {
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

const dashboardApi = {
  async fetch(): Promise<DashboardData> {
    await new Promise((resolve) => setTimeout(resolve, 480));
    return JSON.parse(JSON.stringify(MOCK_DASHBOARD_DATA));
  },
};

export function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="h-[var(--app-height)] w-full bg-background text-foreground flex">
        <Sidebar />
        <DashboardShell />
      </div>
    </SidebarProvider>
  );
}

function DashboardShell() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    const result = await dashboardApi.fetch();
    setData(result);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto md:pt-0">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-5 sm:px-5 lg:px-8">
        <DashboardHeader onRefresh={loadDashboard} isLoading={isLoading} />
        {isLoading || !data ? (
          <DashboardSkeleton />
        ) : (
          <DashboardGrid data={data} />
        )}
      </div>
    </main>
  );
}

function DashboardHeader({
  onRefresh,
  isLoading,
}: {
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
          <div className="space-y-1">
          
          <h1 className="text-2xl font-bold leading-tight">Dashboard</h1>
        </div>
      </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>
      
    </div>
  );
}

function DashboardGrid({ data }: { data: DashboardData }) {
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
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} delay={index * 60} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReplyTimeCard data={data.replyTime} />
        <TicketVolumeCard data={data.ticketVolume} />
      </div>
    </div>
  );
}

function MetricCard({
  metric,
  delay = 0,
}: {
  metric: {
    label: string;
    value: number;
    icon: typeof Ticket;
    change: string;
    changeTone: "up" | "down";
    headline: string;
    body: string;
  };
  delay?: number;
}) {
  const Icon = metric.icon;
  const ChangeIcon = metric.changeTone === "up" ? ArrowUpRight : ArrowDownRight;
  const changeToneClass =
    metric.changeTone === "up" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-4">
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
      <CardContent className="pt-0 space-y-1.5">
        <p className="text-sm font-semibold">{metric.headline}</p>
        <p className="text-sm text-muted-foreground">{metric.body}</p>
      </CardContent>
    </Card>
  );
}

function ReplyTimeCard({ data }: { data: DashboardData["replyTime"] }) {
  const { linePath, areaPath, viewWidth, coords } = useMemo(
    () => buildLinePath(data.points),
    [data.points]
  );

  const minY = Math.min(...data.points.map((p) => p.value));
  const maxY = Math.max(...data.points.map((p) => p.value));

  return (
    <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardDescription>Tempo de resposta (minutos)</CardDescription>
          <CardTitle className="text-3xl">
            {data.averageMinutes.toLocaleString("pt-BR")}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Media da semana - ponto minimo {minY} - ponto maximo {maxY}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 border border-emerald-100">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">
            {data.weekChange > 0 ? "+" : ""}
            {data.weekChange}% vs semana passada
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg bg-gradient-to-b from-primary/5 to-primary/0 border border-border p-4">
          <div
            className="w-full"
            style={{ aspectRatio: `${viewWidth} / 180` }}
          >
            <svg
              viewBox={`0 0 ${viewWidth} 180`}
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="replyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={areaPath}
                fill="url(#replyGradient)"
                className="transition-all duration-500"
              />
              <path
                d={linePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                className="drop-shadow-sm transition-all duration-500"
              />
              {coords.map((point, index) => {
                const isHighlight = data.highlight.label === data.points[index].label;
                return (
                  <g key={data.points[index].label}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isHighlight ? 5.5 : 4}
                      fill={isHighlight ? "hsl(var(--primary))" : "white"}
                      stroke={isHighlight ? "white" : "hsl(var(--primary))"}
                      strokeWidth={isHighlight ? 2 : 2.5}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">
              Melhora rapida em {data.highlight.label} - {data.highlight.value} respostas
            </span>
            <span>Periodo: 7 dias</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketVolumeCard({ data }: { data: DashboardData["ticketVolume"] }) {
  const maxValue = Math.max(
    ...data.series.flatMap((item) => [item.created, item.solved])
  );

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
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
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Ticket Solved</p>
            <p className="text-xl font-semibold">{data.solved.toLocaleString("pt-BR")}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Ticket Created</p>
            <p className="text-xl font-semibold">
              {data.created.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-3 h-44">
          {data.series.map((item) => {
            const createdHeight = Math.max(8, (item.created / maxValue) * 100);
            const solvedHeight = Math.max(8, (item.solved / maxValue) * 100);
            return (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end gap-2 h-32">
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

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

function buildLinePath(points: TrendPoint[]) {
  const viewWidth = Math.max(320, (points.length - 1) * 70);
  const viewHeight = 180;
  const padding = 16;
  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);
  const step = (viewWidth - padding * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => {
    const x = padding + index * step;
    const normalized = (point.value - minValue) / range;
    const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
    return { x, y };
  });

  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
    .join(" ");

  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${viewHeight - padding} L ${first.x.toFixed(2)} ${viewHeight - padding} Z`;

  return { linePath, areaPath, viewWidth, coords };
}
