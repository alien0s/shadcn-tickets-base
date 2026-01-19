import { useId, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { DashboardTicketsData } from "../types";
import { buildLinePath } from "../utils/buildLinePath";

type ReplyTimeCardProps = {
  data: DashboardTicketsData["replyTime"];
};

export function ReplyTimeCard({ data }: ReplyTimeCardProps) {
  // ✅ evita colisão de <linearGradient id="..."> se o componente duplicar na página
  const gradientId = useId();

  // ✅ mantém pesado (path building) memoizado
  const { linePath, areaPath, viewWidth, coords } = useMemo(
    () => buildLinePath(data.points),
    [data.points]
  );

  // ✅ memoiza estatísticas derivadas (não recalcula a cada render)
  const { minY, maxY } = useMemo(() => {
    // defensivo: se um dia points vier vazio, evita Math.min/max em array vazio
    if (data.points.length === 0) return { minY: 0, maxY: 0 };

    let min = data.points[0].value;
    let max = data.points[0].value;

    for (let i = 1; i < data.points.length; i++) {
      const v = data.points[i].value;
      if (v < min) min = v;
      if (v > max) max = v;
    }

    return { minY: min, maxY: max };
  }, [data.points]);

  const weekChangeLabel = `${data.weekChange > 0 ? "+" : ""}${data.weekChange}% vs semana passada`;

  return (
    <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
      <CardHeader className="flex flex-row items-center justify-between p-6 md:p-4">
        <div>
          <CardDescription>Tempo de resposta (minutos)</CardDescription>
          <CardTitle className="text-3xl">
            {data.averageMinutes.toLocaleString("pt-BR")}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Media da semana - ponto minimo {minY} - ponto maximo {maxY}
          </p>
        </div>

        <div
          className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 border border-emerald-100"
          aria-label={weekChangeLabel} // ✅ a11y sem mudar UI
        >
          <Activity className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">{weekChangeLabel}</span>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-4 md:pb-4">
        <div className="rounded-lg bg-gradient-to-b from-primary/5 to-primary/0 border border-border p-4">
          <div className="w-full" style={{ aspectRatio: `${viewWidth} / 180` }}>
            <svg
              viewBox={`0 0 ${viewWidth} 180`}
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
              role="img" // ✅ a11y
              aria-label="Gráfico de linha do tempo de resposta nos últimos 7 dias"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              <path
                d={areaPath}
                fill={`url(#${gradientId})`} // ✅ usa id único
                className="transition-all duration-500"
              />
              <path
                d={linePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                className="drop-shadow-sm transition-all duration-500"
              />

              {/* ✅ itera nos points e pega coord por índice (reduz risco de desencontro) */}
              {data.points.map((p, index) => {
                const point = coords[index];
                const isHighlight = data.highlight.label === p.label;

                // defensivo: se coords ainda não tiver esse índice, não renderiza o círculo
                if (!point) return null;

                return (
                  <g key={p.label}>
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
