import { Fragment, useState, type CSSProperties } from "react";
import { ChevronDown, Copy, CopyCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRhClipboard } from "../hooks/useRhClipboard";
import type { RhTeacherTicketRow } from "../types/rh.types";

type RhTeacherTicketsTableProps = {
  rows: RhTeacherTicketRow[];
  isLoading: boolean;
  error: string | null;
};

const COPY_BURST_PARTICLES = [
  { x: -18, y: -16, delay: 0 },
  { x: -8, y: -22, delay: 20 },
  { x: 8, y: -22, delay: 40 },
  { x: 18, y: -16, delay: 10 },
  { x: -22, y: -2, delay: 35 },
  { x: 22, y: -2, delay: 55 },
  { x: -14, y: 16, delay: 15 },
  { x: 0, y: 20, delay: 30 },
  { x: 14, y: 16, delay: 50 },
] as const;

function getInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "PR";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyValueOnly(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function renderLessons(row: RhTeacherTicketRow) {
  if (row.lessons.length === 0) {
    return (
      <div className="px-4 py-4 text-sm text-muted-foreground">
        Sem aulas cadastradas para este professor.
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-background">
      <table className="w-full min-w-[640px] table-fixed text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="w-[16%] px-3 py-2 text-left font-medium">Dia</th>
            <th className="w-[22%] px-3 py-2 text-left font-medium">Turma</th>
            <th className="w-[32%] px-3 py-2 text-left font-medium">Aula</th>
            <th className="w-[30%] px-3 py-2 text-right font-medium">Ticket</th>
          </tr>
        </thead>
        <tbody>
          {row.lessons.map((lesson) => (
            <tr key={lesson.id} className="border-b border-border/60 last:border-b-0">
              <td className="px-3 py-2 text-muted-foreground">
                <div className="font-medium text-foreground">{lesson.dayLabel}</div>
                <div className="text-xs">{lesson.timeLabel}</div>
              </td>
              <td className="truncate px-3 py-2">{lesson.className}</td>
              <td className="truncate px-3 py-2">{lesson.subjectName}</td>
              <td className="px-3 py-2 text-right">
                <div className={cn("font-semibold", !lesson.hasTicket && "text-muted-foreground")}>
                  {lesson.hasTicket ? formatCurrency(lesson.ticketValue) : "Sem ticket"}
                </div>
                <div className="truncate text-xs text-muted-foreground">{lesson.ticketLabel}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index} className="border-border">
          <TableCell className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-44" />
            </div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell className="px-4 py-3 text-right">
            <Skeleton className="ml-auto h-5 w-28" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function CopyBurst({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <>
      <span className="pointer-events-none absolute inset-0 overflow-visible">
        {COPY_BURST_PARTICLES.map((particle, index) => {
          const particleStyle = {
            "--rh-copy-x": `${particle.x}px`,
            "--rh-copy-y": `${particle.y}px`,
            animation: "rh-copy-burst 720ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
            animationDelay: `${particle.delay}ms`,
          } as CSSProperties;

          return (
            <span
              key={index}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500"
              style={particleStyle}
            />
          );
        })}
      </span>
      <style>
        {`
          @keyframes rh-copy-burst {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.4);
            }
            20% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translate(
                calc(-50% + var(--rh-copy-x)),
                calc(-50% + var(--rh-copy-y))
              ) scale(1);
            }
          }
        `}
      </style>
    </>
  );
}

function TotalTicketsValue({
  rowId,
  value,
  isCopied,
  onCopy,
}: {
  rowId: string;
  value: number;
  isCopied: boolean;
  onCopy: (key: string, value: string) => void | Promise<void>;
}) {
  const formattedValue = formatCurrency(value);
  const copyValueFormatted = formatCurrencyValueOnly(value);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="text-emerald-600">{formattedValue}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative h-7 w-7 overflow-visible rounded-lg text-muted-foreground hover:text-foreground"
        aria-label={`Copiar total ${formattedValue}`}
        onClick={() => {
          void onCopy(rowId, copyValueFormatted);
        }}
      >
        <CopyBurst active={isCopied} />
        {isCopied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function RhTeacherTicketsTable({
  rows,
  isLoading,
  error,
}: RhTeacherTicketsTableProps) {
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
  const { copiedKey, copyValue } = useRhClipboard();

  const toggleTeacher = (teacherId: string) => {
    setExpandedTeacherId((current) => (current === teacherId ? null : teacherId));
  };

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">Professores</h2>
            <p className="truncate text-xs text-muted-foreground">Tickets por aula</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {rows.length} professor{rows.length === 1 ? "" : "es"}
          </span>
        </div>
      </div>

      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="w-[52%] px-4">Professor</TableHead>
            <TableHead className="w-[18%] px-4">Aulas</TableHead>
            <TableHead className="w-[30%] px-4 text-right">Tickets</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {error ? (
            <TableRow className="border-border">
              <TableCell colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                {error}
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <LoadingRows />
          ) : rows.length === 0 ? (
            <TableRow className="border-border">
              <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                Nenhum professor encontrado para esta escola.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const isExpanded = expandedTeacherId === row.id;

              return (
                <Fragment key={row.id}>
                  <TableRow className="border-border">
                    <TableCell className="py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start gap-3 rounded-lg px-0 py-1.5 text-left hover:bg-transparent"
                        aria-expanded={isExpanded}
                        onClick={() => toggleTeacher(row.id)}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                        <Avatar className="h-9 w-9 rounded-lg">
                          <AvatarImage src={row.avatarUrl ?? undefined} alt={row.name} />
                          <AvatarFallback className="rounded-lg text-[10px]">
                            {getInitials(row.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{row.name}</span>
                      </Button>
                    </TableCell>
                    <TableCell
                      className="cursor-pointer px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
                      aria-expanded={isExpanded}
                      onClick={() => toggleTeacher(row.id)}
                    >
                      {row.lessonsCount}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-semibold">
                      <TotalTicketsValue
                        rowId={row.id}
                        value={row.totalTickets}
                        isCopied={copiedKey === row.id}
                        onCopy={copyValue}
                      />
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="border-border bg-muted/20">
                      <TableCell colSpan={3} className="p-0">
                        {renderLessons(row)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </section>
  );
}
