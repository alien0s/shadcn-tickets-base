import { CircleDollarSign, Clock3, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Formata os totais monetários exibidos no card financeiro.
function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Formata a quantidade de horas sem casas decimais.
function formatHours(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
}

// Estrutura visual compartilhada entre os cards de resumo do RH.
function SummaryCard({
  title,
  value,
  tooltip,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string;
  tooltip: string;
  icon: typeof CircleDollarSign;
  isLoading: boolean;
}) {
  return (
    <Card className="w-full rounded-lg border-border/80 shadow-sm sm:w-[300px] xl:w-[330px]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-lg border border-border/70 bg-muted/30 p-1.5 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          {/* Tooltip curto para explicar o número sem ocupar espaço fixo no card. */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Detalhes de ${title}`}
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-black bg-black text-white">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-40 rounded-lg" />
          ) : (
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type RhTicketValueCardProps = {
  totalTicketValue: number;
  totalTicketItems: number;
  isLoading: boolean;
};

// Resume o valor total dos tickets cadastrados para a escola selecionada.
function RhTicketValueCard({
  totalTicketValue,
  totalTicketItems,
  isLoading,
}: RhTicketValueCardProps) {
  return (
    <SummaryCard
      title="Total de tickets"
      value={formatCurrency(totalTicketValue)}
      tooltip={`${totalTicketItems} preço${totalTicketItems === 1 ? "" : "s"} cadastrados para a escola selecionada.`}
      icon={CircleDollarSign}
      isLoading={isLoading}
    />
  );
}

type RhHoursCardProps = {
  totalAnnualHours: number;
  totalWorkloads: number;
  isLoading: boolean;
};

// Resume a soma das horas da matriz da escola selecionada.
function RhHoursCard({
  totalAnnualHours,
  totalWorkloads,
  isLoading,
}: RhHoursCardProps) {
  return (
    <SummaryCard
      title="Horas de aula"
      value={`${formatHours(totalAnnualHours)}h`}
      tooltip={`${totalWorkloads} carga${totalWorkloads === 1 ? "" : "s"} da matriz para a escola selecionada.`}
      icon={Clock3}
      isLoading={isLoading}
    />
  );
}

export { RhTicketValueCard, RhHoursCard };
