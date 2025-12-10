import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, PanelRight } from "lucide-react";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketListItem } from "./TicketListItem";
import type { Ticket } from "./TicketListItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type TicketTypeKey, TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { TicketTypeTabs } from "./TicketTypeTabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useSidebar } from "@/context/sidebar-context";
import { StatusPill, normalizeStatus, type CanonicalStatus } from "./StatusPill";



// mocks só pra layout; depois você troca pelos dados da API
const MOCK_TICKETS: Ticket[] = [
  {
    id: "1",
    subject: "Erro ao acessar painel",
    status: "aberto",
    priority: "alta",
    requester: "João Silva",
    dateLabel: "12 Nov",
    entity: "anra",
  },
  {
    id: "2",
    subject: "Dúvida sobre cobrança",
    status: "pendente",
    priority: "media",
    requester: "Maria Oliveira",
    dateLabel: "10 Nov",
    entity: "aceam",
  },
  {
    id: "3",
    subject: "Solicitação de cancelamento",
    status: "fechado",
    priority: "baixa",
    requester: "Carlos Santos",
    dateLabel: "03 Nov",
    entity: "unob",
    type: "duvida",
  },
  {
    id: "4",
    subject: "Bug na tela de login",
    status: "aberto",
    priority: "alta",
    requester: "Ana Pereira",
    dateLabel: "Hoje",
    entity: "anra",
    type: "erro",
  },
  {
    id: "5",
    subject: "Sugestão de melhoria no chat",
    status: "pendente",
    priority: "media",
    requester: "Roberto Costa",
    dateLabel: "Ontem",
    entity: "aceam",
    type: "sugestao",
  },
];

// Mock de entidades - fonte falsa de API
const MOCK_ENTITIES = [
  { id: "anra", name: "Anra" },
  { id: "aceam", name: "Aceam" },
  { id: "unob", name: "Unob" },
];

const STATUS_FILTER_OPTIONS: { key: CanonicalStatus; label: string }[] = [
  { key: "aberto", label: TICKET_STATUS_STYLES.aberto.label },
  { key: "pendente", label: TICKET_STATUS_STYLES.pendente.label },
  { key: "fechado", label: TICKET_STATUS_STYLES.fechado.label },
];

export function TicketList({
  onSelectTicket,
}: {
  onSelectTicket?: (ticket: Ticket) => void;
}) {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<TicketTypeKey | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | "nao-lido">("todos");
  const [selectedStatuses, setSelectedStatuses] = useState<CanonicalStatus[]>([]);
  const { toggleSidebar } = useSidebar();

  const filteredTickets = MOCK_TICKETS.filter((ticket) => {
    const matchesSearch = ticket.subject
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesEntity =
      selectedEntities.length === 0 ||
      (ticket.entity && selectedEntities.includes(ticket.entity));

    const matchesType = !ticketTypeFilter || ticket.type === ticketTypeFilter;

    // Simulação simples de filtro de status 
    // (na prática "não lido" dependeria de uma prop isUnread ou similar)
    const matchesStatus = statusFilter === "todos" || (statusFilter === "nao-lido" && ticket.status === "aberto");

    const normalizedStatus = normalizeStatus(ticket.status);
    const matchesStatusSelection =
      selectedStatuses.length === 0 ||
      (normalizedStatus ? selectedStatuses.includes(normalizedStatus) : false);

    return matchesSearch && matchesEntity && matchesType && matchesStatus && matchesStatusSelection;
  });

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    onSelectTicket?.(ticket);
  };

  const toggleEntity = (entityId: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entityId)
        ? prev.filter((id) => id !== entityId)
        : [...prev, entityId]
    );
  };

  const toggleStatus = (status: CanonicalStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status]
    );
  };

  // Componente de filtros reutilizável
  const FilterContent = () => (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div>
        <label className="text-sm font-medium mb-2 block">Status</label>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
          <TabsList className="h-8 rounded-lg bg-muted p-1 w-full opacity-100">
            <TabsTrigger value="todos" className="h-6 text-xs px-3 rounded-md flex-1">Todos</TabsTrigger>
            <TabsTrigger value="nao-lido" className="h-6 text-xs px-3 rounded-md flex-1">Não lido</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tipo de Ticket */}
      <div>
        <label className="text-sm font-medium mb-2 block">Tipo de Ticket</label>
        <TicketTypeTabs value={ticketTypeFilter} onValueChange={setTicketTypeFilter} />
      </div>

      {/* Status específicos */}
      <div>
        <label className="text-sm font-medium mb-2 block">Filtrar por status</label>
        <div className="space-y-2">
          {STATUS_FILTER_OPTIONS.map((status) => (
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
          {MOCK_ENTITIES.map((entity) => (
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
          {/* Botão de menu - apenas mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={toggleSidebar}
          >
            <PanelRight className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold">Tickets</span>
        </div>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsNewTicketOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Novo ticket
        </Button>
      </div>

      {/* Caixa de pesquisa + Filtro */}
      <div className="px-3 py-2 border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por assunto..."
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Botão de Filtro - Desktop (Dropdown para Entidades) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 hidden md:flex">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              
              <div className="p-2 space-y-2">
                {STATUS_FILTER_OPTIONS.map((status) => (
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
                {MOCK_ENTITIES.map((entity) => (
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

          {/* Botão de Filtro - Mobile (Popover com todos os filtros) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 md:hidden">
                <Filter className="h-4 w-4" />
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

      {/* Tabs: Todos / Não lido + Filter Type - Apenas Desktop */}
      <div className="px-3 border-border hidden md:flex items-center gap-4">
        {/* Status Tabs (Compact) */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-auto flex-1">
          <TabsList className="h-8 rounded-lg bg-muted p-1 w-full opacity-100">
            <TabsTrigger value="todos" className="h-6 text-xs px-3 rounded-md flex-1">Todos</TabsTrigger>
            <TabsTrigger value="nao-lido" className="h-6 text-xs px-3 rounded-md flex-1">Não lido</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Type Tabs (Square Icons, Separate) */}
        <TicketTypeTabs value={ticketTypeFilter} onValueChange={setTicketTypeFilter} />
      </div>

      {/* Lista scrollável */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {filteredTickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              isActive={selectedTicketId === ticket.id}
              onClick={() => handleSelectTicket(ticket)}
            />
          ))}

          {filteredTickets.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground">
              Nenhum ticket encontrado para "{search}".
            </div>
          )}
        </div>
      </ScrollArea>

      <NewTicketDialog
        open={isNewTicketOpen}
        onOpenChange={setIsNewTicketOpen}
      />
    </div>
  );
}
