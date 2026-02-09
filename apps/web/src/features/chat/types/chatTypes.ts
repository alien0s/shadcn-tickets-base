/* ===========================
 * Tipos base (domínio / API)
 * =========================== */

/**
 * Timestamp sempre em ISO string.
 * - Fácil de serializar
 * - Compatível com backend
 * - UI converte quando necessário
 */
export type ISODateString = string;

/**
 * Campos comuns a qualquer mensagem.
 * Evita duplicação e facilita extensão futura.
 */
interface BaseChatMessage {
  id: string;
  isOwn: boolean;
  timestamp: ISODateString;
  avatarUrl?: string;
  avatarFallback?: string;
}

/**
 * Mensagem de texto (domínio puro)
 */
export interface TextMessage extends BaseChatMessage {
  type: "text";
  content: string;
}

/**
 * Mensagem de arquivo genérico
 * - fileSize é number (bytes), não string formatada
 * - URL pode ser remota ou objectURL temporário
 */
export interface FileMessage extends BaseChatMessage {
  type: "file";
  file: {
    name: string;
    size: number; // bytes (API-ready)
    url: string;
  };
}

/**
 * Mensagem de imagem
 * Mantém estrutura semelhante a FileMessage
 */
export interface ImageMessage extends BaseChatMessage {
  type: "image";
  image: {
    url: string;
    alt?: string;
    width?: number;  // opcional para futura otimização (ex: layout shift)
    height?: number;
  };
}

/**
 * Union principal usada no chat
 */
export type ChatMessage = TextMessage | FileMessage | ImageMessage;

/* ===========================
 * Tipos auxiliares (UI / estado)
 * =========================== */

/**
 * Indicador de digitação
 * Não é domínio de mensagem → estado de UI
 */
export type TypingIndicator = {
  isTyping: boolean;
  avatarUrl: string;
  fallback: string;
  name?: string;
};

/**
 * Attachment usado ANTES de enviar mensagem
 * (ex: previews, drag-and-drop, Ctrl+V)
 *
 * ⚠️ Ainda não é domínio/API
 */
export type PendingAttachment = {
  id: string; // chave estável para React lists
  name: string;
  size: number; // bytes
  kind: "image" | "file";
  url: string; // objectURL (revogar no cleanup)
};

/**
 * Payload para envio de mensagem
 * - Pronto para ser mapeado para API depois
 * - Sem dados formatados de UI
 */
export type SendMessagePayload = {
  text?: string;
  files?: File[];
  attachments?: Array<{
    name: string;
    size: number;
    kind: "image" | "file";
  }>;
};
