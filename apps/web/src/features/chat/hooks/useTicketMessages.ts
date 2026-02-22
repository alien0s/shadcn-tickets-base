import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { useChatMessages } from "./useChatMessages";
import { formatMessageTime } from "../utils/formatMessageTime";
import { getStoredToken } from "@/features/auth/utils/auth-storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ChatMessage, SendMessagePayload } from "../types/chatTypes";

type ApiTicketMessage = {
  id: string;
  type: "text" | "file" | "image" | "system";
  user: {
    id: string;
    name: string;
    avatar_url?: string | null;
  } | null;
  content: string | null;
  read_at?: string | null;
  ticket_id: string;
  created_at: string;
  sender_type: "agent" | "customer" | "system";
  delivered_at?: string | null;
  sender_user_id?: string | null;
};

type ApiTicketDetail = {
  id: string;
  messages: ApiTicketMessage[];
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    preview_url?: string | null;
  }>;
};



const messagesCache = new Map<string, ReturnType<typeof useChatMessages>["messages"]>();
const senderCache = new Map<string, { id: string; name: string; avatar_url?: string | null }>();
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const normalizeUploadsUrl = (value: string) =>
  value.startsWith("/uploads/") ? `${UPLOADS_BASE_URL}${value}` : value;

const fileNameFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    return lastSegment || "Arquivo";
  } catch {
    return value.split("/").filter(Boolean).pop() || "Arquivo";
  }
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

export function useTicketMessages(ticketId: string) {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [ticketImageAttachments, setTicketImageAttachments] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  

  const chat = useChatMessages();
  const cacheKey = `${ticketId}:${currentUser?.id ?? "anon"}`;

  const emitMessageCreated = useCallback(
    (createdAt?: string) => {
      if (typeof window === "undefined" || !ticketId) return;
      window.dispatchEvent(
        new CustomEvent("ticket-message-created", {
          detail: {
            ticketId,
            senderUserId: currentUser?.id ?? null,
            createdAt: createdAt ?? new Date().toISOString(),
          },
        })
      );
    },
    [ticketId, currentUser?.id]
  );
  

  const getSender = async (userId: string) => {
    const cached = senderCache.get(userId);
    if (cached) return cached;

    try {
      const data = await api.get<{ id: string; name: string; avatar_url?: string | null }>(
        `/users/${userId}`
      );
      senderCache.set(userId, data);
      return data;
    } catch {
      return null;
    }
  };

  const mapApiMessage = (message: ApiTicketMessage) => {
    const isOwn =
      (currentUser?.id && message.sender_user_id === currentUser.id) ||
      (!currentUser?.id && message.sender_type === "agent");
    const timestamp = formatMessageTime(message.created_at);
    const content = message.content ?? "";
    const senderName = message.user?.name ?? currentUser?.name ?? "";
    const avatarUrl =
      message.user?.avatar_url ?? currentUser?.avatar_url ?? undefined;
    const avatarFallback = senderName ? getInitials(senderName) : undefined;

    if (message.type === "image" && content) {
      const imageUrl = content.startsWith("/uploads/")
        ? `${UPLOADS_BASE_URL}${content}`
        : content;
      return {
        id: message.id,
        type: "image" as const,
        isOwn,
        timestamp,
        avatarUrl,
        avatarFallback,
        image: {
          url: imageUrl,
          alt: message.user?.name ?? "Imagem",
        },
      };
    }

    if (message.type === "file" && content) {
      const fileUrl = content.startsWith("/uploads/")
        ? `${UPLOADS_BASE_URL}${content}`
        : content;
      return {
        id: message.id,
        type: "file" as const,
        isOwn,
        timestamp,
        avatarUrl,
        avatarFallback,
        file: {
          name: fileNameFromUrl(content),
          size: 0,
          url: fileUrl,
        },
      };
    }

    return {
      id: message.id,
      type: "text" as const,
      isOwn,
      timestamp,
      avatarUrl,
      avatarFallback,
      content,
    };
  };

  

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadMessages = async () => {
      const cached = messagesCache.get(cacheKey);
      if (cached) {
        chat.setMessages(cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const token = getStoredToken();
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(
            payload?.error?.message ||
            payload?.message ||
            "Erro ao carregar mensagens"
          );
        }

        const data = payload.data as ApiTicketDetail;

        if (!isMounted) return;

        const mapped = (data.messages ?? []).map(mapApiMessage);
        const attachments = (data.attachments ?? [])
          .filter((file) => (file.type ?? "").toLowerCase().startsWith("image/"))
          .map((file) => ({
            id: file.id,
            name: file.name,
            url: normalizeUploadsUrl(file.preview_url ?? file.url),
          }));

        messagesCache.set(cacheKey, mapped);
        chat.setMessages(mapped);
        setTicketImageAttachments(attachments);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Erro ao carregar mensagens:", error);
        toast.error("Não foi possível carregar as mensagens do ticket.");
        setTicketImageAttachments([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [cacheKey, currentUser?.id, ticketId]);

  // ✅ Sempre marcar como lido ao abrir o ticket (independente de cache)
  useEffect(() => {
    if (!currentUser?.id || !ticketId) return;
    (async () => {
      try {
        await api.post(`/tickets/${ticketId}/mark-as-read`, {});
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("ticket-read", { detail: { ticketId } })
          );
        }
      } catch (error) {
        console.error("Erro ao marcar ticket como lido:", error);
      }
    })();
  }, [ticketId, currentUser?.id]);

  useEffect(() => {
    if (!ticketId || !isSupabaseConfigured || !supabase) {
      return;
    }

   

    const client = supabase;

 

    const channel = client
  .channel(`ticket:${ticketId}`)
      
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload: any) => {
          const row = payload.new as ApiTicketMessage;
          if (!row?.id) return;

          // ✅ Se a conversa está aberta, marcar como lida ao receber nova mensagem de outro usuário
          if (
            currentUser?.id &&
            row.sender_user_id !== currentUser.id &&
            row.type !== "system"
          ) {
            (async () => {
              try {
                await api.post(`/tickets/${ticketId}/mark-as-read`, {});
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("ticket-read", { detail: { ticketId } })
                  );
                }
              } catch (error) {
                console.error("Erro ao marcar ticket como lido:", error);
              }
            })();
          }

          const existing = messagesCache
            .get(cacheKey)
            ?.some((message) => message.id === row.id);

          if (existing) return;

          let enriched = row;
          if (!row.user && row.sender_user_id) {
            const sender = await getSender(row.sender_user_id);
            if (sender) {
              enriched = {
                ...row,
                user: sender,
              };
            }
          }

          const mapped = mapApiMessage(enriched);

          chat.setMessages((prev) => [...prev, mapped]);

          messagesCache.set(cacheKey, [
            ...(messagesCache.get(cacheKey) ?? []),
            mapped,
          ]);
        }
      )
      
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload: any) => {
          const row = payload.new as ApiTicketMessage;
          if (!row?.id) return;

          const mapped = mapApiMessage(row);
          chat.setMessages((prev) =>
            prev.map((message) => (message.id === row.id ? mapped : message))
          );

          messagesCache.set(
            cacheKey,
            (messagesCache.get(cacheKey) ?? []).map((message) =>
              message.id === row.id ? mapped : message
            )
          );
        }
      )
      
      
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ [REALTIME] Conectado:", ticketId);
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ [REALTIME] Erro no channel:", err);
        } else if (status === "TIMED_OUT") {
          console.warn("⚠️ [REALTIME] Timeout:", ticketId);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [ticketId, cacheKey, currentUser?.id]);

  

  return {
    ...chat,
    ticketImageAttachments,
    sendMessage: (payload: SendMessagePayload) => {
      const text = (payload as { text?: string }).text ?? "";
      const files =
        ("files" in (payload as any) ? (payload as any).files : undefined) ??
        ((payload as any).attachments ?? []);

      if (!text && files.length === 0) return;

      if (files.length > 0) {
        const createdAt = new Date().toISOString();
        const optimisticIds: string[] = [];
        const optimisticMessages: ChatMessage[] = [];

        if (text.trim()) {
          const optimisticId = `temp-text-${Date.now()}`;
          optimisticIds.push(optimisticId);
          optimisticMessages.push({
            id: optimisticId,
            type: "text" as const,
            isOwn: true,
            content: text,
            timestamp: formatMessageTime(createdAt),
            avatarUrl: currentUser?.avatar_url,
            avatarFallback: currentUser?.name
              ? getInitials(currentUser.name)
              : undefined,
          });
        }

        const objectUrls: string[] = [];
        (files as File[]).forEach((file) => {
          const optimisticId = `temp-file-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;
          optimisticIds.push(optimisticId);

          const url = URL.createObjectURL(file);
          objectUrls.push(url);

          if (file.type.startsWith("image/")) {
            optimisticMessages.push({
              id: optimisticId,
              type: "image" as const,
              isOwn: true,
              timestamp: formatMessageTime(createdAt),
              avatarUrl: currentUser?.avatar_url,
              avatarFallback: currentUser?.name
                ? getInitials(currentUser.name)
                : undefined,
              image: {
                url,
                alt: file.name,
              },
            });
          } else {
            optimisticMessages.push({
              id: optimisticId,
              type: "file" as const,
              isOwn: true,
              timestamp: formatMessageTime(createdAt),
              avatarUrl: currentUser?.avatar_url,
              avatarFallback: currentUser?.name
                ? getInitials(currentUser.name)
                : undefined,
              file: {
                name: file.name,
                size: file.size ?? 0,
                url,
              },
            });
          }
        });

        if (optimisticMessages.length > 0) {
          chat.setMessages((prev) => [...prev, ...optimisticMessages]);
          messagesCache.set(cacheKey, [
            ...(messagesCache.get(cacheKey) ?? []),
            ...optimisticMessages,
          ]);
        }

        (async () => {
          try {
            const formData = new FormData();
            if (text) formData.append("content", text);
            (files as File[]).forEach((file) => {
              formData.append("files", file);
            });

            const token = getStoredToken();
            const response = await fetch(
              `${API_BASE_URL}/tickets/${ticketId}/messages`,
              {
                method: "POST",
                body: formData,
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );

            const result = await response.json();
            if (!response.ok || !result?.success) {
              throw new Error(
                result?.error?.message ||
                result?.message ||
                "Erro ao enviar mensagens"
              );
            }

            const created = Array.isArray(result.data)
              ? result.data
              : [result.data];
            const mapped = created.map(mapApiMessage);

            chat.setMessages((prev) => [
              ...prev.filter((message) => !optimisticIds.includes(message.id)),
              ...mapped,
            ]);
            messagesCache.set(
              cacheKey,
              (messagesCache.get(cacheKey) ?? [])
                .filter((message) => !optimisticIds.includes(message.id))
                .concat(mapped)
            );
            emitMessageCreated(created[0]?.created_at);
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
          } catch (error) {
            chat.setMessages((prev) =>
              prev.filter((message) => !optimisticIds.includes(message.id))
            );
            messagesCache.set(
              cacheKey,
              (messagesCache.get(cacheKey) ?? []).filter(
                (message) => !optimisticIds.includes(message.id)
              )
            );
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
            toast.error("Não foi possível enviar a mensagem.");
          }
        })();

        return;
      }

      if (!text) return;

      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        type: "text" as const,
        isOwn: true,
        content: text,
        timestamp: formatMessageTime(new Date().toISOString()),
        avatarUrl: currentUser?.avatar_url,
        avatarFallback: currentUser?.name
          ? getInitials(currentUser.name)
          : undefined,
      };

      chat.setMessages((prev) => [...prev, optimisticMessage]);
      messagesCache.set(cacheKey, [
        ...(messagesCache.get(cacheKey) ?? []),
        optimisticMessage,
      ]);

      (async () => {
        try {
          const data = await api.post<ApiTicketMessage>(
            `/tickets/${ticketId}/messages`,
            { content: text }
          );
          const mapped = mapApiMessage(data);

          chat.setMessages((prev) =>
            prev.map((message) =>
              message.id === optimisticId ? mapped : message
            )
          );

          messagesCache.set(
            cacheKey,
            (messagesCache.get(cacheKey) ?? []).map((message) =>
              message.id === optimisticId ? mapped : message
            )
          );
          emitMessageCreated(data?.created_at);
        } catch (error) {
          chat.setMessages((prev) =>
            prev.filter((message) => message.id !== optimisticId)
          );
          messagesCache.set(
            cacheKey,
            (messagesCache.get(cacheKey) ?? []).filter(
              (message) => message.id !== optimisticId
            )
          );
          toast.error("Não foi possível enviar a mensagem.");
        }
      })();
    },
    isLoading
  };
}
