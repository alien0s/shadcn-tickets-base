// ChatWindow.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import type { MessageInputHandle } from "./MessageInput";
import { MessageBubble } from "./MessageBubble";
import { AttachmentViewer } from "@/features/attachments/components/AttachmentViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Ticket } from "@/features/tickets/types/ticketTypes";
import { ArrowLeft } from "lucide-react";
import { useChatMessages } from "../hooks/useChatMessages";
import { useIsDesktopDetailsVisible } from "../hooks/useIsDesktopDetailsVisible";
import { useIsMobile } from "../hooks/useIsMobile";
import { useFileAttachments } from "@/features/UploadFileMessage/hooks/useFileAttachments";
import { useChatDropzone } from "../hooks/useChatDropzone";
import { toast } from "sonner";
import { formatFileSize } from "../utils/formatFileSize";


type Props = {
  ticket: Ticket;
  onToggleDetails?: () => void;
  onBack?: () => void;
};

export function ChatWindow({ ticket, onToggleDetails, onBack }: Props) {
  const isMobile = useIsMobile(); // usado para escolher container de scroll
  const isDetailsVisibleOnDesktop = useIsDesktopDetailsVisible();
  const headerIsClickable = !isDetailsVisibleOnDesktop;

  // Viewer (galeria)
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Refs de scroll
  const scrollAreaRef = useRef<HTMLDivElement>(null); // ScrollArea (desktop)
  const mobileScrollRef = useRef<HTMLDivElement>(null); // div scrollável (mobile)
  const inputRef = useRef<MessageInputHandle>(null);

  // Controle de "msg nova" (efeito visual)
  const previousMessageCountRef = useRef(0);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);

  // Attachments do input (inclui dedupe + paste, etc)
  const attachments = useFileAttachments({
    maxFiles: 10,
    onDuplicateFiles: (duplicates) => {
      if (duplicates.length === 0) return;
      const names = duplicates.map((file) => file.name).join(", ");
      toast.warning(`Arquivo já adicionado: ${names}`);
    },
  });

  // Mensagens do chat
  const { imageMessages, messages, sendMessage, typingIndicator } =
    useChatMessages();

  // Dropzone invisível no chat todo (drag & drop)
  const { isDraggingFiles, bind } = useChatDropzone({
    onDropFiles: attachments.addFiles,
    existingFiles: attachments.selectedFiles,
  });

  /**
   * Retorna o elemento "viewport" que realmente scrolla.
   * - Mobile: a própria div com overflow
   * - Desktop: o viewport interno do Radix ScrollArea
   */
  const getScrollViewport = useCallback((): HTMLDivElement | null => {
    if (isMobile) return mobileScrollRef.current;

    if (!scrollAreaRef.current) return null;
    return scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
  }, [isMobile]);

  /**
   * Scroll para o final de forma segura.
   * requestAnimationFrame ajuda quando a DOM ainda está "assentando".
   */
  const scrollToBottom = useCallback(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    requestAnimationFrame(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [getScrollViewport]);

  const handleImageClick = useCallback(
    (messageId: string) => {
      const index = imageMessages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      setSelectedImageIndex(index);
      setIsAttachmentViewerOpen(true);
    },
    [imageMessages]
  );

  // Render único das mensagens (evita duplicar mobile/desktop)
  const renderedMessages = useMemo(() => {
    return messages.map((message) => {
      if (message.type === "text") {
        return (
          <MessageBubble
            key={message.id}
            type="text"
            isOwn={message.isOwn}
            content={message.content}
            timestamp={message.timestamp}
            isNew={newMessageId === message.id}
          />
        );
      }

      if (message.type === "file") {
        return (
          <MessageBubble
            key={message.id}
            type="file"
            isOwn={message.isOwn}
            fileName={message.file.name} // ✅ novo shape
            fileSize={formatFileSize(message.file.size)} // ✅ bytes → string (UI)
            fileUrl={message.file.url} // ✅ novo shape
            timestamp={message.timestamp}
            isNew={newMessageId === message.id}
          />

        );
      }

      return (
        <MessageBubble
          key={message.id}
          type="image"
          isOwn={message.isOwn}
          imageUrl={message.image.url}
          alt={message.image.alt}
          timestamp={message.timestamp}
          imageMessageId={message.id} // ✅ passa só o id
          onImageClick={handleImageClick} // ✅ função estável
          isNew={newMessageId === message.id}
        />
      );
    });
  }, [messages, newMessageId, handleImageClick]);

  // Render do indicador de digitação (reutilizável)
  const renderedTypingIndicator = useMemo(() => {
    if (!typingIndicator.isTyping) return null;

    return (
      <div className="flex items-start gap-2">
        <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
          <AvatarImage
            src={typingIndicator.avatarUrl}
            alt={typingIndicator.name || "Outro participante"}
          />
          <AvatarFallback className="rounded-lg text-xs">
            {typingIndicator.fallback}
          </AvatarFallback>
        </Avatar>

        <div className="bg-muted text-muted-foreground px-3 py-2 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center gap-1">
            <span className="block h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.2s]" />
            <span className="block h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.1s]" />
            <span className="block h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
          </div>
        </div>
      </div>
    );
  }, [typingIndicator]);

  /**
   * Quando troca de ticket:
   * - scroll pro fim
   * - foco no input (somente desktop)
   */
  useEffect(() => {
    scrollToBottom();

    if (typeof window === "undefined") return;
    const isMobileNow = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobileNow) {
      // foco só no desktop, evita "pular tela" no iOS
      inputRef.current?.focus();
    }
  }, [ticket.id, scrollToBottom]);

  /**
   * Quando novas mensagens chegam, scrolla pro fim.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  /**
   * Marca a mensagem mais recente como "nova" para animação curta.
   */
  useEffect(() => {
    const previousCount = previousMessageCountRef.current;

    if (messages.length > previousCount && previousCount > 0) {
      const latestMessage = messages[messages.length - 1];
      setNewMessageId(latestMessage.id);

      const timeoutId = window.setTimeout(() => setNewMessageId(null), 240);
      previousMessageCountRef.current = messages.length;

      return () => window.clearTimeout(timeoutId);
    }

    previousMessageCountRef.current = messages.length;
    return;
  }, [messages]);

  return (
    <div className="relative h-full flex flex-col overflow-hidden" {...bind}>
      {/* Overlay do drag-and-drop (invisível até arrastar arquivos) */}
      {isDraggingFiles && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="rounded-lg border border-dashed border-primary bg-primary/5 px-6 py-4 text-sm">
            Solte para anexar
          </div>
        </div>
      )}

      {/* Header do chat */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border transition-colors">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Botão de voltar (somente mobile) */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {headerIsClickable ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex flex-col min-w-0 cursor-pointer p-1 -m-1 rounded-md"
                  onClick={onToggleDetails}
                  role="button"
                  tabIndex={0}
                >
                  <span className="text-sm font-semibold truncate">
                    {ticket.subject}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Cliente - {ticket.status} - {ticket.priority}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white px-2 py-1 text-xs border-none rounded-md">
                <p>Ver detalhes do ticket</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">
                {ticket.subject}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Cliente - {ticket.status} - {ticket.priority}
              </span>
            </div>
          )}
        </div>

        {/* Botão "Fechar ticket" */}
        <Button
          size="sm"
          className="bg-emerald-500 text-white hover:bg-emerald-600"
          onClick={() => {
            // TODO(API): integração com backend para fechamento
          }}
        >
          Fechar ticket
        </Button>
      </div>

      {/* Mensagens (mesma UI, só muda o container/scroll) */}
      {isMobile ? (
        <div ref={mobileScrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {renderedMessages}
            {renderedTypingIndicator}
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="p-4 space-y-3">
            {renderedMessages}
            {renderedTypingIndicator}
          </div>
        </ScrollArea>
      )}

      {/* Input de mensagem (com attachments externos do ChatWindow) */}
      <MessageInput ref={inputRef} onSend={sendMessage} attachments={attachments} />

      {/* Viewer de anexos (imagens do chat) */}
      <AttachmentViewer
        open={isAttachmentViewerOpen}
        onOpenChange={setIsAttachmentViewerOpen}
        initialIndex={selectedImageIndex}
      />
    </div>
  );
}
