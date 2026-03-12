import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ShiftKey } from "../types";

export type ToolbarOption = {
  value: string;
  label: string;
  avatarUrl?: string;
};

type GradeToolbarProps = {
  shift: ShiftKey;
  escola: string;
  professor: string;
  onShiftChange: (value: ShiftKey) => void;
  onEscolaChange: (value: string) => void;
  onProfessorChange: (value: string) => void;
  escolaOptions: readonly ToolbarOption[];
  professorOptions: readonly ToolbarOption[];
  isLoadingSchools: boolean;
  isLoadingTeachers: boolean;
  isProfessorPanelOpen: boolean;
  onToggleProfessorPanel: () => void;
};

type ShiftOption = {
  value: ShiftKey;
  label: string;
};

const SHIFT_OPTIONS: readonly ShiftOption[] = [
  { value: "M", label: "M" },
  { value: "V", label: "V" },
];

const SCHOOL_COLOR_CLASSES = [
  "bg-blue-100 border-blue-200",
  "bg-rose-100 border-rose-200",
  "bg-amber-100 border-amber-200",
  "bg-emerald-100 border-emerald-200",
  "bg-orange-100 border-orange-200",
] as const;

function getSchoolColorClass(index: number): string {
  return SCHOOL_COLOR_CLASSES[index % SCHOOL_COLOR_CLASSES.length];
}

function ToolbarSelect({
  value,
  options,
  onChange,
  ariaLabel,
  isLoading,
}: {
  value: string;
  options: readonly ToolbarOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  isLoading: boolean;
}) {
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "Sem escolas";
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedColorClass = getSchoolColorClass(selectedIndex >= 0 ? selectedIndex : 0);
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-11 w-[210px] rounded-md" />;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={options.length === 0}
          className="h-11 w-[210px] justify-between gap-2 bg-background px-2 font-medium text-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={ariaLabel}
        >
          <span
            className={cn("h-8 w-8 shrink-0 rounded-md border", selectedColorClass)}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-left text-sm">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[210px]">
        {options.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma escola disponível</DropdownMenuItem>
        ) : options.map((option) => {
          const index = options.findIndex((item) => item.value === option.value);
          const isActive = option.value === value;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(isActive && "bg-accent/40 text-primary font-medium")}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn("h-8 w-8 shrink-0 rounded-md border", getSchoolColorClass(index))}
                  aria-hidden="true"
                />
                <span className="truncate">{option.label}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function stopDropdownTypeahead(event: KeyboardEvent<HTMLInputElement>) {
  event.stopPropagation();
}

function ToolbarProfessorSelect({
  value,
  options,
  onChange,
  isLoading,
}: {
  value: string;
  options: readonly ToolbarOption[];
  onChange: (value: string) => void;
  isLoading: boolean;
}) {
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "Sem professores";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (isLoading) {
    return <Skeleton className="h-11 w-[210px] rounded-md" />;
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={options.length === 0}
          className="h-11 w-[210px] justify-between gap-2 bg-background px-2 font-medium text-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Selecionar professor"
        >
          <ProfessorAvatar
            src={selectedOption?.avatarUrl}
            label={selectedLabel}
            sizeClassName="h-8 w-8"
            fallbackClassName="rounded-md border border-input bg-muted/40 text-[10px] font-semibold text-foreground"
          />
          <span className="min-w-0 flex-1 truncate text-left text-sm">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[210px]">
        <div className="relative mb-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={stopDropdownTypeahead}
            placeholder="Buscar professor..."
            className="h-8 w-full rounded-sm border border-input bg-background pl-7 pr-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            autoComplete="off"
          />
        </div>
        {filteredOptions.length === 0 ? (
          <DropdownMenuItem disabled>Nenhum resultado</DropdownMenuItem>
        ) : options.length === 0 ? (
          <DropdownMenuItem disabled>Nenhum professor disponível</DropdownMenuItem>
        ) : filteredOptions.map((option) => {
          const isActive = option.value === value;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(isActive && "bg-accent/40 text-primary font-medium")}
            >
              <div className="flex items-center gap-2">
                <ProfessorAvatar
                  src={option.avatarUrl}
                  label={option.label}
                  sizeClassName="h-8 w-8"
                  fallbackClassName="rounded-md text-[10px] font-semibold"
                />
                <span className="truncate">{option.label}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfessorAvatar({
  src,
  label,
  sizeClassName,
  fallbackClassName,
}: {
  src?: string;
  label: string;
  sizeClassName: string;
  fallbackClassName?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(!src);
  }, [src]);

  return (
    <div className="relative shrink-0">
      {!isLoaded && <Skeleton className={cn(sizeClassName, "rounded-md")} />}
      <Avatar className={cn(sizeClassName, "rounded-md", !isLoaded && "absolute inset-0 opacity-0")}>
        <AvatarImage
          src={src}
          alt={label}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
        <AvatarFallback className={fallbackClassName}>
          {getInitials(label)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

export function GradeToolbar({
  shift,
  escola,
  professor,
  onShiftChange,
  onEscolaChange,
  onProfessorChange,
  escolaOptions,
  professorOptions,
  isLoadingSchools,
  isLoadingTeachers,
  isProfessorPanelOpen,
  onToggleProfessorPanel,
}: GradeToolbarProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
      <ToolbarSelect
        value={escola}
        options={escolaOptions}
        onChange={onEscolaChange}
        ariaLabel="Selecionar escola"
        isLoading={isLoadingSchools}
      />
      <ToolbarProfessorSelect
        value={professor}
        options={professorOptions}
        onChange={onProfessorChange}
        isLoading={isLoadingTeachers}
      />

      <div className="flex h-11 items-center rounded-md border border-border bg-muted/30 p-1">
        {SHIFT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onShiftChange(option.value)}
            className={cn(
              "h-9 w-9 rounded-md text-sm font-semibold transition-colors",
              shift === option.value
                ? "bg-primary/15 text-primary"
                : "text-foreground hover:bg-muted"
            )}
            aria-pressed={shift === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11"
        aria-label={isProfessorPanelOpen ? "Ocultar painel do professor" : "Mostrar painel do professor"}
        onClick={onToggleProfessorPanel}
      >
        {isProfessorPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </Button>
    </div>
  );
}
