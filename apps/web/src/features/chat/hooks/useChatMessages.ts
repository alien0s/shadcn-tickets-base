import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  SendMessagePayload,
  TypingIndicator,
} from "../types/chatTypes";

// Gera id estável de forma simples para mock (sem dependência externa)
function createMessageId(seed: string, index: number) {
  // seed evita repetir Date.now() várias vezes e mantém ordem previsível
  return `${seed}-${index}`;
}

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({
    isTyping: false,
    avatarUrl: "",
    fallback: "",
    name: "",
  });

  // Memo: lista só de imagens para o viewer (AttachmentViewer)
  const imageMessages = useMemo(
    () =>
      messages.filter(
        (message): message is Extract<ChatMessage, { type: "image" }> =>
          message.type === "image"
      ),
    [messages]
  );

  // Ref para evitar recriar timer de "typing" desnecessariamente
  const typingTimerRef = useRef<number | null>(null);

  /**
   * Envia mensagem no mock:
   * - cria 1..N mensagens (texto + arquivos)
   * - mantém ordem previsível
   * - cria ids consistentes
   */
  const sendMessage = useCallback((payload: SendMessagePayload) => {
    // ✅ Compat: suporta payload antigo (files) e novo (attachments) sem quebrar TS
    const text = (payload as { text?: string }).text ?? "";
    const files =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ("files" in (payload as any) ? (payload as any).files : undefined) ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((payload as any).attachments ?? []);

    if (!text && files.length === 0) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const seed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setMessages((prev) => {
      const next: ChatMessage[] = [...prev];
      let cursor = 0;

      if (text) {
        next.push({
          id: createMessageId(seed, cursor++),
          type: "text",
          isOwn: true,
          content: text,
          timestamp,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const file of files as any[]) {
        if (file.kind === "image") {
          next.push({
            id: createMessageId(seed, cursor++),
            type: "image",
            isOwn: true,
            image: {
              url: file.url,
              alt: file.name,
            },
            timestamp,
          });
        } else {
          next.push({
            id: createMessageId(seed, cursor++),
            type: "file",
            isOwn: true,
            file: {
              name: file.name,
              size: file.size ?? 0,
              url: file.url,
            },
            timestamp,
          });
        }
      }

      return next;
    });
  }, []);

  /*
   * Auto-hide typing indicator (habilitar quando implementarmos "digitando").
   * - se isTyping liga, agenda desligar em 2.5s
   * - se ligar de novo antes disso, reseta o timer
   */
  // useEffect(() => {
  //   if (!typingIndicator.isTyping) return;
  //
  //   // SSR safety (defensivo): evita usar window no servidor
  //   if (typeof window === "undefined") return;
  //
  //   if (typingTimerRef.current) {
  //     window.clearTimeout(typingTimerRef.current);
  //     typingTimerRef.current = null;
  //   }
  //
  //   typingTimerRef.current = window.setTimeout(() => {
  //     setTypingIndicator((prev) => ({ ...prev, isTyping: false }));
  //     typingTimerRef.current = null;
  //   }, 2500);
  //
  //   return () => {
  //     if (typingTimerRef.current) {
  //       window.clearTimeout(typingTimerRef.current);
  //       typingTimerRef.current = null;
  //     }
  //   };
  // }, [typingIndicator.isTyping]);

  return {
    imageMessages,
    messages,
    sendMessage,

    // 🔧 MOCK/DEV: manter setters é útil enquanto não tem API.
    // Em produção, o ideal é expor actions (receiveMessage, setTyping, etc.)
    setMessages,
    setTypingIndicator,
    typingIndicator,
  };
}
