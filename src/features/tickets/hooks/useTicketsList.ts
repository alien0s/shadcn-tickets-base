import { useEffect, useMemo, useState } from "react";
import { mockEntities, mockTickets } from "../data/mockTickets";
import type { Ticket } from "../types/ticketTypes";
import type { TicketTypeKey } from "@/config/ticket-constants";
import { TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { normalizeStatus, type CanonicalStatus } from "../utils/status";

export function useTicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<TicketTypeKey | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | "nao-lido">("todos");
  const [selectedStatuses, setSelectedStatuses] = useState<CanonicalStatus[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTickets(mockTickets);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const statusFilterOptions = useMemo(
    () => [
      { key: "aberto" as const, label: TICKET_STATUS_STYLES.aberto.label },
      { key: "pendente" as const, label: TICKET_STATUS_STYLES.pendente.label },
      { key: "fechado" as const, label: TICKET_STATUS_STYLES.fechado.label },
    ],
    []
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = ticket.subject
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesEntity =
        selectedEntities.length === 0 ||
        (ticket.entity && selectedEntities.includes(ticket.entity));

      const matchesType = !ticketTypeFilter || ticket.type === ticketTypeFilter;

      // Simulacao simples de filtro de status
      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "nao-lido" && ticket.status === "aberto");

      const normalizedStatus = normalizeStatus(ticket.status);
      const matchesStatusSelection =
        selectedStatuses.length === 0 ||
        (normalizedStatus ? selectedStatuses.includes(normalizedStatus) : false);

      return (
        matchesSearch &&
        matchesEntity &&
        matchesType &&
        matchesStatus &&
        matchesStatusSelection
      );
    });
  }, [
    tickets,
    search,
    selectedEntities,
    ticketTypeFilter,
    statusFilter,
    selectedStatuses,
  ]);

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

  return {
    filteredTickets,
    isLoading,
    search,
    setSearch,
    selectedEntities,
    selectedTicketId,
    setSelectedTicketId,
    statusFilter,
    setStatusFilter,
    statusFilterOptions,
    ticketTypeFilter,
    setTicketTypeFilter,
    selectedStatuses,
    toggleEntity,
    toggleStatus,
    entities: mockEntities,
  };
}
