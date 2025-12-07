import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketListItem } from "./TicketListItem";
import type { Ticket } from "./TicketListItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";


// mocks só pra layout; depois você troca pelos dados da API
const MOCK_TICKETS: Ticket[] = [
  {
    id: "1",
    subject: "Erro ao acessar painel",
    status: "aberto",
    priority: "alta",
    dateLabel: "12 Nov",
    entity: "anra",
  },
  {
    id: "2",
    subject: "Dúvida sobre cobrança",
    status: "pendente",
    priority: "media",
    dateLabel: "10 Nov",
    entity: "aceam",
  },
  {
    id: "3",
    subject: "Solicitação de cancelamento",
    status: "fechado",
    priority: "baixa",
    dateLabel: "03 Nov",
    entity: "unob",
  },
];

// Mock de entidades - fonte falsa de API
const MOCK_ENTITIES = [
  { id: "anra", name: "Anra" },
  { id: "aceam", name: "Aceam" },
  { id: "unob", name: "Unob" },
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

  const filteredTickets = MOCK_TICKETS.filter((ticket) => {
    const matchesSearch = ticket.subject
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesEntity =
      selectedEntities.length === 0 ||
      (ticket.entity && selectedEntities.includes(ticket.entity));

    return matchesSearch && matchesEntity;
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

  return (
    <div className="h-full flex flex-col">
      {/* Header da coluna */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border">
        <span className="text-lg font-bold">Tickets</span>
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

          {/* Botão de Filtro */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Entidades</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
        </div>

      </div>

      {/* Tabs: Todos / Não lido */}
      <div className="px-3 border-border">
        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="todos" className="flex-1">Todos</TabsTrigger>
            <TabsTrigger value="nao-lido" className="flex-1">Não lido</TabsTrigger>
          </TabsList>
        </Tabs>
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
