import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, ListFilter, PanelRight } from "lucide-react";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketListItem } from "./TicketListItem";
import type { Ticket } from "../types/ticketTypes";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketTypeTabs } from "./TicketTypeTabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useSidebar } from "@/context/sidebar-context";
import { StatusPill } from "./StatusPill";
import { useTicketsList } from "../hooks/useTicketsList";
import { useTicketBadges } from "../hooks/useTicketBadges";

export function TicketList({
  onSelectTicket,
  isNewTicketOpen,
  onNewTicketOpenChange,
}: {
  onSelectTicket?: (ticket: Ticket) => void;
  isNewTicketOpen: boolean;
  onNewTicketOpenChange: (open: boolean) => void;
}) {
  const [typingPreviewByTicket, setTypingPreviewByTicket] = useState<Map<string, string>>(
    () => new Map()
  );

  const {
    filteredTickets,
    isLoading,
    search,
    setSearch,
    selectedEntities,
    selectedTicketId,
    setSelectedTicketId,
    highlightedTicketIds,
    fadingTicketIds,
    statusFilter,
    setStatusFilter,
    statusFilterOptions,
    ticketTypeFilter,
    setTicketTypeFilter,
    selectedStatuses,
    toggleEntity,
    toggleStatus,
    entities,
    refreshTickets,
  } = useTicketsList();
  const { badges, getUnreadCount } = useTicketBadges();

  const { toggleSidebar } = useSidebar();

  const handleSelectTicket = useCallback(
    (ticket: Ticket) => {
      setSelectedTicketId(ticket.id);
      onSelectTicket?.(ticket);
    },
    [onSelectTicket, setSelectedTicketId]
  );

  /**
   * ✅ Evita criar handler inline em TODA renderização.
   * - Ainda existe 1 handler por ticket (natural), mas só é recriado quando `filteredTickets` muda.
   * - Ajuda quando TicketListItem usa React.memo.
   */
  const ticketClickHandlers = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const ticket of filteredTickets) {
      map.set(ticket.id, () => handleSelectTicket(ticket));
    }
    return map;
  }, [filteredTickets, handleSelectTicket]);

  useEffect(() => {
    const handleTicketTyping = (event: Event) => {
      const detail = (
        event as CustomEvent<{ ticketId?: string; userName?: string; isTyping?: boolean }>
      ).detail;
      const ticketId = detail?.ticketId;
      if (!ticketId) return;

      if (detail?.isTyping === false) {
        setTypingPreviewByTicket((prev) => {
          if (!prev.has(ticketId)) return prev;
          const next = new Map(prev);
          next.delete(ticketId);
          return next;
        });
        return;
      }

      const userName = detail?.userName?.trim() || "Alguem";
      const typingPreview = `${userName} esta digitando...`;

      setTypingPreviewByTicket((prev) => {
        const next = new Map(prev);
        next.set(ticketId, typingPreview);
        return next;
      });
    };

    const handleTicketMessageCreated = (event: Event) => {
      const detail = (event as CustomEvent<{ ticketId?: string }>).detail;
      const ticketId = detail?.ticketId;
      if (!ticketId) return;

      setTypingPreviewByTicket((prev) => {
        if (!prev.has(ticketId)) return prev;
        const next = new Map(prev);
        next.delete(ticketId);
        return next;
      });
    };

    window.addEventListener("ticket-typing", handleTicketTyping as EventListener);
    window.addEventListener(
      "ticket-message-created",
      handleTicketMessageCreated as EventListener
    );

    return () => {
      window.removeEventListener("ticket-typing", handleTicketTyping as EventListener);
      window.removeEventListener(
        "ticket-message-created",
        handleTicketMessageCreated as EventListener
      );
    };
  }, []);

  // Componente de filtros reutilizavel
  const FilterContent = () => (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div>
        <label className="text-sm font-medium mb-2 block">Status</label>
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "todos" | "nao-lido")}
          className="w-full"
        >
          <TabsList className="h-8 rounded-lg bg-muted p-1 w-full opacity-100">
            <TabsTrigger value="todos" className="h-6 text-xs px-3 rounded-md flex-1">
              Todos
            </TabsTrigger>
            <TabsTrigger value="nao-lido" className="h-6 text-xs px-3 rounded-md flex-1">
              Não lido
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tipo de Ticket */}
      <div>
        <label className="text-sm font-medium mb-2 block">Tipo de Ticket</label>
        <TicketTypeTabs value={ticketTypeFilter} onValueChange={setTicketTypeFilter} />
      </div>

      {/* Status especificos */}
      <div>
        <label className="text-sm font-medium mb-2 block">Filtrar por status</label>
        <div className="space-y-2">
          {statusFilterOptions.map((status) => (
            <div key={status.key} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status.key}`}
                checked={selectedStatuses.includes(status.key)}
                onCheckedChange={() => toggleStatus(status.key)}
              />
              <label
                htmlFor={`status-${status.key}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <StatusPill status={status.key} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Entidades */}
      <div>
        <label className="text-sm font-medium mb-2 block">Entidades</label>
        <div className="space-y-2">
          {entities.map((entity) => (
            <div key={entity.id} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${entity.id}`}
                checked={selectedEntities.includes(entity.id)}
                onCheckedChange={() => toggleEntity(entity.id)}
              />
              <label
                htmlFor={`filter-${entity.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {entity.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header da coluna */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Botao de menu - apenas mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={toggleSidebar}
            aria-label="Abrir menu lateral"
          >
            <PanelRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="text-lg font-bold">Tickets</span>
        </div>

        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => onNewTicketOpenChange(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo ticket
        </Button>
      </div>

      {/* Caixa de pesquisa + Filtro */}
      <div className="px-3 py-2 border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por assunto..."
              className="pl-8 h-9 md:text-sm"
            />
          </div>

          {/* Botao de Filtro - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 hidden md:flex"
                aria-label="Abrir filtros"
              >
                <ListFilter className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>

              <div className="p-2 space-y-2">
                {statusFilterOptions.map((status) => (
                  <div key={status.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dropdown-status-${status.key}`}
                      checked={selectedStatuses.includes(status.key)}
                      onCheckedChange={() => toggleStatus(status.key)}
                    />
                    <label
                      htmlFor={`dropdown-status-${status.key}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <StatusPill status={status.key} />
                    </label>
                  </div>
                ))}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Entidades</DropdownMenuLabel>

              <div className="p-2 space-y-2">
                {entities.map((entity) => (
                  <div key={entity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={entity.id}
                      checked={selectedEntities.includes(entity.id)}
                      onCheckedChange={() => toggleEntity(entity.id)}
                    />
                    <label
                      htmlFor={entity.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {entity.name}
                    </label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botao de Filtro - Mobile */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 md:hidden"
                aria-label="Abrir filtros"
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Filtros</h3>
                <FilterContent />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tabs: Apenas Desktop */}
      <div className="px-3 border-border hidden md:flex items-center gap-4">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "todos" | "nao-lido")}
          className="w-auto flex-1"
        >
          <TabsList className="h-8 rounded-lg bg-muted p-1 w-full opacity-100">
            <TabsTrigger value="todos" className="h-6 text-xs px-3 rounded-md flex-1">
              Todos
            </TabsTrigger>
            <TabsTrigger value="nao-lido" className="h-6 text-xs px-3 rounded-md flex-1">
              Não lido
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <TicketTypeTabs value={ticketTypeFilter} onValueChange={setTicketTypeFilter} />
      </div>

      {/* Lista scrollavel */}
      <ScrollArea className="flex-1 min-w-0">
        <div className="py-2 w-full min-w-0">
          {isLoading ? (
            <TicketListSkeleton />
          ) : (
            <>
              {filteredTickets.map((ticket) => (
                <TicketListItem
                  key={ticket.id}
                  ticket={{
                    ...ticket,
                    unreadCount: badges.has(ticket.id)
                      ? getUnreadCount(ticket.id)
                      : ticket.unreadCount,
                  }}
                  typingPreview={typingPreviewByTicket.get(ticket.id)}
                  isActive={selectedTicketId === ticket.id}
                  isHighlighting={highlightedTicketIds.has(ticket.id)}
                  isFadingHighlight={fadingTicketIds.has(ticket.id)}
                  onClick={ticketClickHandlers.get(ticket.id) ?? (() => handleSelectTicket(ticket))} // fallback seguro
                />
              ))}

              {filteredTickets.length === 0 && (
                <div className="px-3 py-4 text-xs text-muted-foreground">
                  {search.trim().length > 0
                    ? `Nenhum ticket encontrado para "${search}".`
                    : "Sem tickets"}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <NewTicketDialog
        open={isNewTicketOpen}
        onOpenChange={onNewTicketOpenChange}
        onCreated={refreshTickets}
      />
    </div>
  );
}

function TicketListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="w-full px-3 py-2 flex items-start gap-3 text-left">
          <Skeleton className="h-9 w-9 rounded-md mt-[2px]" />

          <div className="flex-1 flex flex-col min-w-0 gap-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-2.5 w-10 rounded-md" />
            </div>

            <Skeleton className="h-2.5 w-44 rounded-md" />

            <div className="mt-1 flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
