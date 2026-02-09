import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ticket } from "../types/ticketTypes";
import type { TicketTypeKey } from "@/config/ticket-constants";
import { TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { normalizeStatus, type CanonicalStatus } from "../utils/status";
import { api } from "@/lib/api";
import { useEntities } from "@/hooks/useEntities";

type StatusFilter = "todos" | "nao-lido";

type ApiTicket = {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  unread_count?: number | null;
  status: {
    id: number;
    key: string;
    label: string;
    order: number;
  } | null;
  priority: {
    id: number;
    key: string;
    label: string;
    order: number;
  } | null;
  type: {
    id: number;
    key: string;
    label: string;
  } | null;
  requester: {
    id: string;
    name: string;
    avatar_url?: string | null;
  } | null;
  assigned_to?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  } | null;
  entity_id?: string | null;
};

const STATUS_KEY_MAP: Record<string, Ticket["status"]> = {
  open: "open",
  pending: "pending",
  closed: "closed",
};

const PRIORITY_KEY_MAP: Record<string, Ticket["priority"]> = {
  low: "low",
  normal: "medium",
  high: "high",
};

const TYPE_KEY_MAP: Record<string, TicketTypeKey> = {
  error: "erro",
  suggestion: "sugestao",
  question: "duvida",
};

let ticketsCache: Ticket[] | null = null;

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60 * 1000) return "agora";

  const timeLabel = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return timeLabel;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) {
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

export function useTicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<TicketTypeKey | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [selectedStatuses, setSelectedStatuses] = useState<CanonicalStatus[]>([]);

  const {
    entities: entitiesData,
    isLoading: isLoadingEntities,
  } = useEntities();

  const fetchTickets = useCallback(
    async (useCache = true) => {
      if (useCache && ticketsCache) {
        setTickets(ticketsCache);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await api.getWithMeta<ApiTicket[]>(
          "/tickets?sortBy=updated_at&order=desc&limit=100"
        );

        if (!isMountedRef.current) return;

        const mapped = (data ?? []).map<Ticket>((item) => {
          const statusKey = item.status?.key?.toLowerCase();
          const priorityKey = item.priority?.key?.toLowerCase();
          const typeKey = item.type?.key?.toLowerCase();

          return {
            id: item.id,
            title: item.title ?? "",
            subject: item.subject ?? item.title ?? "",
            status: (statusKey && STATUS_KEY_MAP[statusKey]) || "open",
            priority: (priorityKey && PRIORITY_KEY_MAP[priorityKey]) || "low",
            type: (typeKey && TYPE_KEY_MAP[typeKey]) || undefined,
            requester: item.requester?.name ?? "",
            avatarUrl: item.requester?.avatar_url ?? undefined,
            dateLabel: formatDateLabel(item.updated_at ?? item.created_at),
            entity: item.entity_id ?? undefined,
            unreadCount: item.unread_count ?? undefined,
          };
        });

        ticketsCache = mapped;
        setTickets(mapped);
      } catch (error) {
        console.error("Erro ao carregar tickets:", error);
        if (isMountedRef.current) setTickets([]);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    []
  );

  const refreshTickets = useCallback(async () => {
    ticketsCache = null;
    await fetchTickets(false);
  }, [fetchTickets]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTickets(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTickets]);

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
        !ticket.entity ||
        selectedEntities.includes(ticket.entity);

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
    () => entitiesData.map((entity) => ({ id: entity.id, name: entity.name })),
    [entitiesData]
  );

  return {
    filteredTickets,
    isLoading: isLoading || isLoadingEntities,

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
    refreshTickets,
  };
}
