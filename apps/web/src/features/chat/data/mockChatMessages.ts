import type { ChatMessage, TypingIndicator } from "../types/chatTypes";

/**
 * Mock do indicador de digitação.
 * Em produção:
 * - isso vem via websocket / polling
 * - nunca deve ser hardcoded como true
 */
export const mockTypingIndicator: TypingIndicator = {
  isTyping: true, // 🔧 em produção normalmente começa false
  avatarUrl:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s",
  fallback: "OP",
  name: "Cliente",
};

/**
 * Mock de mensagens do chat.
 * Serve apenas para UI / layout / comportamento.
 *
 * Observação importante:
 * - tamanho de arquivo aqui está em bytes (number), API-ready
 * - a UI deve formatar (ex: "2.4 KB") via helper (formatFileSize)
 */
export const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-1", // prefixo ajuda a diferenciar de ids reais futuramente
    type: "text",
    isOwn: false,
    content: "Olá, estou com um problema para acessar o sistema.",
    timestamp: "10:30",
  },
  {
    id: "msg-2",
    type: "text",
    isOwn: true,
    content: "Olá! Pode me enviar um print do erro que aparece?",
    timestamp: "10:32",
  },
  {
    id: "msg-3",
    type: "file",
    isOwn: false,
    file: {
      name: "error-logs.pdf",
      size: 2458, // ~2.4 KB (mock em bytes)
      url: "#",
    },
    timestamp: "10:35",
  },
  {
    id: "msg-4",
    type: "image",
    isOwn: true,
    image: {
      url: "https://64.media.tumblr.com/f43536e7eaf1c5ef943e4879e44f7611/tumblr_oxg6vi8kBV1wx5fjeo1_1280.jpg",
      alt: "Screenshot do erro",
    },
    timestamp: "10:36",
  },
  {
    id: "msg-5",
    type: "file",
    isOwn: true,
    file: {
      name: "solution-guide.pdf",
      size: 1258291, // ~1.2 MB (mock em bytes)
      url: "#",
    },
    timestamp: "10:38",
  },
  {
    id: "msg-6",
    type: "image",
    isOwn: false,
    image: {
      url: "https://images.wondershare.com/filmora/article-images/6-tumblr-dashboard.jpg",
      alt: "Screenshot do erro",
    },
    timestamp: "10:40",
  },
];
