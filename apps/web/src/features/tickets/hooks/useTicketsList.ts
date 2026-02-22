import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ticket } from "../types/ticketTypes";
import type { TicketTypeKey } from "@/config/ticket-constants";
import { TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { normalizeStatus, type CanonicalStatus } from "../utils/status";
import { api } from "@/lib/api";
import { useEntities } from "@/hooks/useEntities";
import { useAuth } from "@/features/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

type TicketMessageCreatedDetail = {
  ticketId: string;
  senderUserId?: string | null;
  createdAt?: string | null;
};

type TicketClosedDetail = {
  ticketId: string;
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
let ticketTypeFilterCache: TicketTypeKey | null = null;
let ticketsCacheOwnerUserId: string | null = null;

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
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const refreshTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutsRef = useRef<Map<string, number>>(new Map());
  const fadeTimeoutsRef = useRef<Map<string, number>>(new Map());
  const [highlightedTicketIds, setHighlightedTicketIds] = useState<Set<string>>(
    () => new Set()
  );
  const [fadingTicketIds, setFadingTicketIds] = useState<Set<string>>(
    () => new Set()
  );

  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketIdState] = useState<string | null>(null);

  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [ticketTypeFilter, setTicketTypeFilterState] = useState<TicketTypeKey | null>(
    () => ticketTypeFilterCache
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [selectedStatuses, setSelectedStatuses] = useState<CanonicalStatus[]>([]);

  const {
    entities: entitiesData,
    isLoading: isLoadingEntities,
  } = useEntities();

  const fetchTickets = useCallback(
    async (useCache = true, showLoading = true) => {
      if (useCache && ticketsCache && ticketsCacheOwnerUserId === (user?.id ?? null)) {
        setTickets(ticketsCache);
        setIsLoading(false);
        return;
      }

      if (showLoading) {
        setIsLoading(true);
      }
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
        ticketsCacheOwnerUserId = user?.id ?? null;
        setTickets(mapped);
      } catch (error) {
        console.error("Erro ao carregar tickets:", error);
        if (isMountedRef.current && showLoading) setTickets([]);
      } finally {
        if (isMountedRef.current && showLoading) setIsLoading(false);
      }
    },
    [user?.id]
  );

  const refreshTickets = useCallback(async () => {
    ticketsCache = null;
    ticketsCacheOwnerUserId = null;
    await fetchTickets(false);
  }, [fetchTickets]);

  const moveTicketToTopOnMessage = useCallback(
    (detail: TicketMessageCreatedDetail) => {
      if (!detail.ticketId) return;
      let moved = false;

      setTickets((prev) => {
        const index = prev.findIndex((ticket) => ticket.id === detail.ticketId);
        if (index === -1) return prev;
        moved = true;

        const updated = [...prev];
        const current = updated[index];
        const isOwnMessage =
          Boolean(detail.senderUserId) && detail.senderUserId === user?.id;

        const nextTicket: Ticket = {
          ...current,
          dateLabel: formatDateLabel(detail.createdAt ?? new Date().toISOString()),
          unreadCount: isOwnMessage
            ? current.unreadCount
            : (current.unreadCount ?? 0) + 1,
        };

        updated.splice(index, 1);
        updated.unshift(nextTicket);
        ticketsCache = updated;
        return updated;
      });

      return moved;
    },
    [user?.id]
  );

  const addTicketHighlight = useCallback(
    (ticketId: string) => {
      if (!ticketId || selectedTicketId === ticketId) return;

      const existingTimeout = highlightTimeoutsRef.current.get(ticketId);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      setHighlightedTicketIds((prev) => {
        const updated = new Set(prev);
        updated.add(ticketId);
        return updated;
      });
      setFadingTicketIds((prev) => {
        if (!prev.has(ticketId)) return prev;
        const updated = new Set(prev);
        updated.delete(ticketId);
        return updated;
      });

      const timeoutId = window.setTimeout(() => {
        highlightTimeoutsRef.current.delete(ticketId);
        setFadingTicketIds((prev) => {
          const updated = new Set(prev);
          updated.add(ticketId);
          return updated;
        });

        const fadeTimeoutId = window.setTimeout(() => {
          fadeTimeoutsRef.current.delete(ticketId);
          setHighlightedTicketIds((prev) => {
            const updated = new Set(prev);
            updated.delete(ticketId);
            return updated;
          });
          setFadingTicketIds((prev) => {
            const updated = new Set(prev);
            updated.delete(ticketId);
            return updated;
          });
        }, 500);

        fadeTimeoutsRef.current.set(ticketId, fadeTimeoutId);
      }, 5000);

      highlightTimeoutsRef.current.set(ticketId, timeoutId);
    },
    [selectedTicketId]
  );

  const setSelectedTicketId = useCallback((ticketId: string | null) => {
    setSelectedTicketIdState(ticketId);

    if (!ticketId) return;

    const existingTimeout = highlightTimeoutsRef.current.get(ticketId);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
      highlightTimeoutsRef.current.delete(ticketId);
    }
    const existingFadeTimeout = fadeTimeoutsRef.current.get(ticketId);
    if (existingFadeTimeout) {
      window.clearTimeout(existingFadeTimeout);
      fadeTimeoutsRef.current.delete(ticketId);
    }

    setHighlightedTicketIds((prev) => {
      if (!prev.has(ticketId)) return prev;
      const updated = new Set(prev);
      updated.delete(ticketId);
      return updated;
    });
    setFadingTicketIds((prev) => {
      if (!prev.has(ticketId)) return prev;
      const updated = new Set(prev);
      updated.delete(ticketId);
      return updated;
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTickets(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTickets]);

  // ✅ Limpa cache e recarrega quando trocar de usuário
  useEffect(() => {
    if (!user?.id) {
      ticketsCache = null;
      ticketsCacheOwnerUserId = null;
      setTickets([]);
      return;
    }

    if (ticketsCache && ticketsCacheOwnerUserId === user.id) {
      setTickets(ticketsCache);
      setIsLoading(false);
      return;
    }

    ticketsCache = null;
    ticketsCacheOwnerUserId = null;
    fetchTickets(false).catch(() => null);
  }, [user?.id, fetchTickets]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || !supabase) return;
    const client = supabase;

    const scheduleRefresh = (delayMs = 500) => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        ticketsCache = null;
        ticketsCacheOwnerUserId = null;
        fetchTickets(false, false).catch(() => null);
        refreshTimeoutRef.current = null;
      }, delayMs);
    };

    const channel = client
      .channel("tickets-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets" },
        (payload) => {
          const row = payload.new as {
            id: string;
            requester_user_id?: string | null;
          };

          if (!row?.id) return;

          if (user.role === "client" && row.requester_user_id !== user.id) {
            return;
          }

          addTicketHighlight(row.id);
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets" },
        (payload) => {
          const row = payload.new as {
            id?: string;
            requester_user_id?: string | null;
            assigned_to_user_id?: string | null;
          };

          if (!row?.id) return;

          if (
            user.role === "client" &&
            row.requester_user_id !== user.id &&
            row.assigned_to_user_id !== user.id
          ) {
            return;
          }

          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages" },
        (payload) => {
          const row = payload.new as {
            ticket_id?: string | null;
            sender_user_id?: string | null;
            type?: string | null;
            created_at?: string | null;
          };

          if (!row?.ticket_id) return;
          if (row.type === "system") return;

          const moved = moveTicketToTopOnMessage({
            ticketId: row.ticket_id,
            senderUserId: row.sender_user_id,
            createdAt: row.created_at,
          });
          if (!moved) {
            scheduleRefresh();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_user_reads", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { ticket_id?: string | null };
          if (!row?.ticket_id) return;

          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.id === row.ticket_id ? { ...ticket, unreadCount: 0 } : ticket
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ticket_user_reads", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { ticket_id?: string | null };
          if (!row?.ticket_id) return;

          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.id === row.ticket_id ? { ...ticket, unreadCount: 0 } : ticket
            )
          );
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ [REALTIME] Conectado: tickets");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ [REALTIME] Erro no channel:", err);
        } else if (status === "TIMED_OUT") {
          console.warn("⚠️ [REALTIME] Timeout: tickets");
        }
      });

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      client.removeChannel(channel);
    };
  }, [user?.id, user?.role, refreshTickets, fetchTickets, addTicketHighlight, moveTicketToTopOnMessage]);

  useEffect(() => {
    const handleTicketMessageCreated = (event: Event) => {
      const { detail } = event as CustomEvent<TicketMessageCreatedDetail>;
      if (!detail?.ticketId) return;
      moveTicketToTopOnMessage(detail);
    };

    window.addEventListener("ticket-message-created", handleTicketMessageCreated);
    return () => {
      window.removeEventListener("ticket-message-created", handleTicketMessageCreated);
    };
  }, [moveTicketToTopOnMessage]);

  useEffect(() => {
    const handleTicketClosed = (event: Event) => {
      const { detail } = event as CustomEvent<TicketClosedDetail>;
      if (!detail?.ticketId) return;

      setTickets((prev) => {
        const updated = prev.map((ticket) =>
          ticket.id === detail.ticketId ? { ...ticket, status: "closed" } : ticket
        );
        ticketsCache = updated;
        return updated;
      });
    };

    window.addEventListener("ticket-closed", handleTicketClosed);
    return () => {
      window.removeEventListener("ticket-closed", handleTicketClosed);
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of highlightTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      highlightTimeoutsRef.current.clear();
      for (const timeoutId of fadeTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      fadeTimeoutsRef.current.clear();
    };
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
        !ticket.entity ||
        selectedEntities.includes(ticket.entity);

      const matchesType = !ticketTypeFilter || ticket.type === ticketTypeFilter;

      // ✅ “Não lido” mockado como "aberto" (quando tiver API, isso vira um campo real)
      const matchesStatusTab =
        statusFilter === "todos" ||
        (statusFilter === "nao-lido" && (ticket.unreadCount ?? 0) > 0);

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

  const setTicketTypeFilter = useCallback((next: TicketTypeKey | null) => {
    ticketTypeFilterCache = next;
    setTicketTypeFilterState(next);
  }, []);

  return {
    filteredTickets,
    isLoading: isLoading || isLoadingEntities,

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
  };
}
