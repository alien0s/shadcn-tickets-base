import { useCallback, useEffect, useMemo, useState } from "react";
import { mockEntities, mockTickets } from "../data/mockTickets";
import type { Ticket } from "../types/ticketTypes";
import type { TicketTypeKey } from "@/config/ticket-constants";
import { TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { normalizeStatus, type CanonicalStatus } from "../utils/status";

type StatusFilter = "todos" | "nao-lido";

export function useTicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<TicketTypeKey | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [selectedStatuses, setSelectedStatuses] = useState<CanonicalStatus[]>([]);

  useEffect(() => {
    // ✅ Mock loading: em API real vai existir carregamento — mas depois você pode evoluir pra cache.
    const timer = window.setTimeout(() => {
      setTickets(mockTickets); // ✅ mantém referência estável do mock (sem deep clone desnecessário)
      setIsLoading(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, []);

  // ✅ Normaliza search 1x por render (evita toLowerCase por ticket)
  const searchNormalized = useMemo(() => search.trim().toLowerCase(), [search]);

  const statusFilterOptions = useMemo(
    () =>
      (["aberto", "pendente", "fechado"] as const).map((key) => ({
        key,
        label: TICKET_STATUS_STYLES[key].label,
      })),
    []
  );

  const filteredTickets = useMemo(() => {
    // ✅ Caso comum: sem filtros e sem busca → retorna lista inteira
    if (
      searchNormalized.length === 0 &&
      selectedEntities.length === 0 &&
      !ticketTypeFilter &&
      statusFilter === "todos" &&
      selectedStatuses.length === 0
    ) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const subject = (ticket.subject ?? "").toLowerCase();

      const matchesSearch =
        searchNormalized.length === 0 || subject.includes(searchNormalized);

      const matchesEntity =
        selectedEntities.length === 0 ||
        (ticket.entity ? selectedEntities.includes(ticket.entity) : false);

      const matchesType = !ticketTypeFilter || ticket.type === ticketTypeFilter;

      // ✅ “Não lido” mockado como "aberto" (quando tiver API, isso vira um campo real)
      const matchesStatusTab =
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
        matchesStatusTab &&
        matchesStatusSelection
      );
    });
  }, [
    tickets,
    searchNormalized,
    selectedEntities,
    ticketTypeFilter,
    statusFilter,
    selectedStatuses,
  ]);

  // ✅ callbacks estáveis (ajuda React.memo e evita recriar handlers em listas grandes)
  const toggleEntity = useCallback((entityId: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entityId)
        ? prev.filter((id) => id !== entityId)
        : [...prev, entityId]
    );
  }, []);

  const toggleStatus = useCallback((status: CanonicalStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status]
    );
  }, []);

  // ✅ Se mockEntities estiver `as const`, normalizamos para array mutável “normal” (evita atrito).
  const entities = useMemo(
    () => mockEntities.map((e) => ({ id: e.id, name: e.name })),
    []
  );

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

    entities,
  };
}
