import { useEffect, useMemo, useState } from "react";
import { mockChatMessages, mockTypingIndicator } from "../data/mockChatMessages";
import type { ChatMessage, SendMessagePayload, TypingIndicator } from "../types/chatTypes";

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [typingIndicator, setTypingIndicator] =
    useState<TypingIndicator>(mockTypingIndicator);

  const imageMessages = useMemo(
    () =>
      messages.filter(
        (message): message is Extract<ChatMessage, { type: "image" }> =>
          message.type === "image"
      ),
    [messages]
  );

  const sendMessage = (payload: SendMessagePayload) => {
    const { text, files } = payload;
    if (!text && files.length === 0) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => {
      const next = [...prev];

      if (text) {
        next.push({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: "text",
          isOwn: true,
          content: text,
          timestamp,
        });
      }

      files.forEach((file) => {
        if (file.kind === "image") {
          next.push({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: "image",
            isOwn: true,
            imageUrl: file.url,
            alt: file.name,
            timestamp,
          });
        } else {
          next.push({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: "file",
            isOwn: true,
            fileName: file.name,
            fileSize: file.sizeLabel,
            fileUrl: file.url,
            timestamp,
          });
        }
      });

      return next;
    });
  };

  // Auto-hide typing indicator after a short idle period to avoid constant animations.
  useEffect(() => {
    if (!typingIndicator.isTyping) return;
    const timer = setTimeout(() => {
      setTypingIndicator((prev) => ({ ...prev, isTyping: false }));
    }, 2500);
    return () => clearTimeout(timer);
  }, [typingIndicator.isTyping]);

  return {
    imageMessages,
    messages,
    sendMessage,
    setMessages,
    setTypingIndicator,
    typingIndicator,
  };
}
