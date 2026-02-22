import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/features/auth";

type ApiTicket = {
  id: string;
  unread_count?: number | null;
};

let badgesCache: Map<string, number> | null = null;
let badgesCacheOwnerUserId: string | null = null;

export function useTicketBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Map<string, number>>(new Map());

  // Carregar contagem inicial a partir da listagem
  useEffect(() => {
    if (!user) {
      badgesCache = null;
      badgesCacheOwnerUserId = null;
      setBadges(new Map());
      return;
    }

    if (badgesCache && badgesCacheOwnerUserId === user.id) {
      setBadges(new Map(badgesCache));
      return;
    }

    let isMounted = true;

    const loadInitialBadges = async () => {
      try {
        const { data } = await api.getWithMeta<ApiTicket[]>(
          "/tickets?sortBy=updated_at&order=desc&limit=100"
        );

        if (!isMounted) return;

        const badgeMap = new Map<string, number>();
        (data ?? []).forEach((ticket) => {
          badgeMap.set(ticket.id, ticket.unread_count ?? 0);
        });

        badgesCache = new Map(badgeMap);
        badgesCacheOwnerUserId = user.id;
        setBadges(badgeMap);
      } catch (error) {
        console.error("Erro ao carregar badges de tickets:", error);
      }
    };

    loadInitialBadges();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Escutar novas mensagens em realtime
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel("ticket-badges")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
        },
        (payload) => {
          const newMessage = payload.new as {
            ticket_id: string;
            sender_user_id?: string | null;
            type?: string | null;
          };

          if (!newMessage?.ticket_id) return;
          if (newMessage.sender_user_id === user.id) return;
          if (newMessage.type === "system") return;

          setBadges((prev) => {
            const current = prev.get(newMessage.ticket_id) ?? 0;
            const updated = new Map(prev);
            updated.set(newMessage.ticket_id, current + 1);
            badgesCache = new Map(updated);
            badgesCacheOwnerUserId = user.id;
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ticket_user_reads",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const read = payload.new as { ticket_id?: string | null };
          if (!read?.ticket_id) return;

          setBadges((prev) => {
            const updated = new Map(prev);
            updated.set(read.ticket_id as string, 0);
            badgesCache = new Map(updated);
            badgesCacheOwnerUserId = user.id;
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_user_reads",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const read = payload.new as { ticket_id?: string | null };
          if (!read?.ticket_id) return;

          setBadges((prev) => {
            const updated = new Map(prev);
            updated.set(read.ticket_id as string, 0);
            badgesCache = new Map(updated);
            badgesCacheOwnerUserId = user.id;
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 🔔 Escuta resets locais (quando a conversa é aberta)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ ticketId?: string }>).detail;
      const ticketId = detail?.ticketId;
      if (!ticketId) return;

      setBadges((prev) => {
        const updated = new Map(prev);
        updated.set(ticketId, 0);
        if (user?.id) {
          badgesCache = new Map(updated);
          badgesCacheOwnerUserId = user.id;
        }
        return updated;
      });
    };

    window.addEventListener("ticket-read", handler as EventListener);

    return () => {
      window.removeEventListener("ticket-read", handler as EventListener);
    };
  }, [user?.id]);

  const getUnreadCount = useMemo(
    () => (ticketId: string) => badges.get(ticketId) ?? 0,
    [badges]
  );

  return {
    badges,
    getUnreadCount,
  };
}
