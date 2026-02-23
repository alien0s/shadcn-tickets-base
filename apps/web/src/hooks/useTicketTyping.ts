import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/features/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

const TYPING_TTL_MS = 3000;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

type TypingBroadcastPayload = {
  ticketId?: string;
  userId?: string;
  userName?: string;
  avatarUrl?: string | null;
  avatarFallback?: string;
  isTyping?: boolean;
};

export type TypingUser = {
  userId: string;
  userName: string;
  avatarUrl?: string;
  avatarFallback: string;
};

const typingUserCache = new Map<
  string,
  { userName?: string; avatarUrl?: string }
>();

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function normalizeAvatarUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith("/uploads/")) return `${UPLOADS_BASE_URL}${value}`;
  return value;
}

export function useTicketTyping(ticketId: string) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutByUserRef = useRef<Map<string, number>>(new Map());
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const clearAllTimeouts = useCallback(() => {
    for (const timeoutId of timeoutByUserRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    timeoutByUserRef.current.clear();
  }, []);

  const removeTypingUser = useCallback((userId: string) => {
    setTypingUsers((prev) => prev.filter((item) => item.userId !== userId));
  }, []);

  const scheduleRemoveTypingUser = useCallback(
    (userId: string) => {
      const currentTimeout = timeoutByUserRef.current.get(userId);
      if (currentTimeout) {
        window.clearTimeout(currentTimeout);
      }

      const timeoutId = window.setTimeout(() => {
        timeoutByUserRef.current.delete(userId);
        removeTypingUser(userId);
      }, TYPING_TTL_MS);

      timeoutByUserRef.current.set(userId, timeoutId);
    },
    [removeTypingUser]
  );

  const upsertTypingUser = useCallback(
    (typingUser: TypingUser) => {
      setTypingUsers((prev) => {
        const index = prev.findIndex((item) => item.userId === typingUser.userId);
        if (index === -1) {
          return [...prev, typingUser];
        }

        const next = [...prev];
        next[index] = typingUser;
        return next;
      });

      scheduleRemoveTypingUser(typingUser.userId);
    },
    [scheduleRemoveTypingUser]
  );

  const sendTypingEvent = useCallback((isTyping = true) => {
    if (!ticketId || !user?.id || !channelRef.current) return;

    const payload: TypingBroadcastPayload = {
      ticketId,
      userId: user.id,
      userName: user.name,
      avatarUrl: normalizeAvatarUrl(user.avatar_url),
      avatarFallback: getInitials(user.name ?? "") || "U",
      isTyping,
    };

    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload,
    });
  }, [ticketId, user?.avatar_url, user?.id, user?.name]);

  useEffect(() => {
    setTypingUsers([]);
    clearAllTimeouts();
  }, [ticketId, clearAllTimeouts]);

  useEffect(() => {
    if (!ticketId || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`ticket-typing:${ticketId}`)
      .on("broadcast", { event: "typing" }, (event) => {
        const hydrateTypingUser = async (payload: TypingBroadcastPayload) => {
          if (!payload.userId) return;
          const cached = typingUserCache.get(payload.userId);

          let userName = payload.userName ?? cached?.userName ?? "Usuario";
          let avatarUrl =
            normalizeAvatarUrl(payload.avatarUrl) ?? cached?.avatarUrl;

          if (!avatarUrl) {
            try {
              const profile = await api.get<{
                name?: string;
                avatar_url?: string | null;
              }>(`/users/${payload.userId}`);

              userName = profile?.name ?? userName;
              avatarUrl = normalizeAvatarUrl(profile?.avatar_url) ?? avatarUrl;
            } catch {
              // noop
            }
          }

          typingUserCache.set(payload.userId, { userName, avatarUrl });

          upsertTypingUser({
            userId: payload.userId,
            userName,
            avatarUrl,
            avatarFallback:
              payload.avatarFallback ?? (getInitials(userName) || "U"),
          });
        };

        const payload = event.payload as TypingBroadcastPayload;
        if (!payload?.ticketId || payload.ticketId !== ticketId) return;
        if (!payload.userId || payload.userId === user?.id) return;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("ticket-typing", {
              detail: {
                ticketId: payload.ticketId,
                userId: payload.userId,
                userName: payload.userName ?? "Usuario",
                isTyping: payload.isTyping !== false,
                at: new Date().toISOString(),
              },
            })
          );
        }

        if (payload.isTyping === false) {
          removeTypingUser(payload.userId);
          return;
        }

        void hydrateTypingUser(payload);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      clearAllTimeouts();
      setTypingUsers([]);
      supabase.removeChannel(channel);
    };
  }, [ticketId, clearAllTimeouts, removeTypingUser, upsertTypingUser, user?.id]);

  return {
    typingUsers,
    sendTypingEvent,
  };
}


