import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import type { MessageInputHandle } from "./MessageInput";
import { MessageBubble } from "./MessageBubble";
import { AttachmentViewer } from "@/features/attachments/components/AttachmentViewer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Ticket } from "@/features/tickets/types/ticketTypes";
import { ArrowLeft, LoaderCircleIcon } from "lucide-react";
import { useTicketMessages } from "../hooks/useTicketMessages";
import { useIsDesktopDetailsVisible } from "../hooks/useIsDesktopDetailsVisible";
import { useIsMobile } from "../hooks/useIsMobile";
import { useFileAttachments } from "@/features/UploadFileMessage/hooks/useFileAttachments";
import { useChatDropzone } from "../hooks/useChatDropzone";
import { formatFileSize } from "../utils/formatFileSize";
import { toast } from "sonner";
import { TICKET_PRIORITY_STYLES, TICKET_STATUS_STYLES } from "@/config/ticket-constants";
import { normalizeStatus } from "@/features/tickets/utils/status";
import { api } from "@/lib/api";

type Props = {
  ticket: Ticket;
  onToggleDetails?: () => void;
  onBack?: () => void;
};

export function ChatWindow({ ticket, onToggleDetails, onBack }: Props) {
  const isMobile = useIsMobile();
  const isDetailsVisibleOnDesktop = useIsDesktopDetailsVisible();
  const headerIsClickable = !isDetailsVisibleOnDesktop;
  const [isClosingTicket, setIsClosingTicket] = useState(false);
  const [isTicketClosed, setIsTicketClosed] = useState(
    ticket.status === "closed" || ticket.status === "fechado"
  );

  const statusLabel = useMemo(() => {
    const normalized = normalizeStatus(ticket.status);
    if (normalized) return TICKET_STATUS_STYLES[normalized].label;
    return String(ticket.status);
  }, [ticket.status]);

  const priorityLabel = useMemo(() => {
    const key = String(ticket.priority).toLowerCase();
    if (key === "low" || key === "baixa") return TICKET_PRIORITY_STYLES.baixa.label;
    if (key === "medium" || key === "media" || key === "normal") return TICKET_PRIORITY_STYLES.media.label;
    if (key === "high" || key === "alta") return TICKET_PRIORITY_STYLES.alta.label;
    return String(ticket.priority);
  }, [ticket.priority]);

  const handleCloseTicket = useCallback(async () => {
    if (isClosingTicket) return;
    setIsClosingTicket(true);
    try {
      await api.patch(`/tickets/${ticket.id}/close`, {});
      setIsTicketClosed(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ticket-closed", { detail: { ticketId: ticket.id } })
        );
      }
      toast.success("Ticket fechado com sucesso");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao fechar ticket";
      toast.error(message);
    } finally {
      setIsClosingTicket(false);
    }
  }, [isClosingTicket, ticket.id]);

  useEffect(() => {
    setIsTicketClosed(ticket.status === "closed" || ticket.status === "fechado");
  }, [ticket.id, ticket.status]);

  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<MessageInputHandle>(null);

  const scrollMessageCountRef = useRef(0);
  const animationMessageCountRef = useRef(0);
  const initialScrollAppliedRef = useRef(false);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);

  const attachments = useFileAttachments({
    maxFiles: 10,
    onDuplicateFiles: (duplicates) => {
      if (duplicates.length === 0) return;
      const names = duplicates.map((file) => file.name).join(", ");
      toast.warning(`Arquivo já adicionado: ${names}`);
    },
  });

  // ✅ Usar typingUsers e sendTypingEvent do hook
  const {
    imageMessages,
    messages,
    sendMessage,
   
    isLoading,
    ticketImageAttachments,
  } = useTicketMessages(ticket.id);

  const { isDraggingFiles, bind } = useChatDropzone({
    onDropFiles: attachments.addFiles,
    existingFiles: attachments.selectedFiles,
  });

  const getScrollViewport = useCallback((): HTMLDivElement | null => {
    if (isMobile) return mobileScrollRef.current;

    if (!scrollAreaRef.current) return null;
    return scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
  }, [isMobile]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    requestAnimationFrame(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
    });
  }, [getScrollViewport]);

  const viewerItems = useMemo(() => {
    const fromMessages = imageMessages.map((message) => ({
      id: message.id,
      type: "image" as const,
      url: message.image.url,
      name: message.image.alt ?? "Imagem",
    }));

    const fromAttachments = ticketImageAttachments.map((file) => ({
      id: `attachment-${file.id}`,
      type: "image" as const,
      url: file.url,
      name: file.name,
    }));

    const seen = new Set<string>();
    const merged = [];

    for (const item of [...fromMessages, ...fromAttachments]) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }

    return merged;
  }, [imageMessages, ticketImageAttachments]);

  const handleImageClick = useCallback(
    (messageId: string) => {
      const index = viewerItems.findIndex((item) => item.id === messageId);
      if (index === -1) return;

      setSelectedImageIndex(index);
      setIsAttachmentViewerOpen(true);
    },
    [viewerItems]
  );

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
            avatarUrl={message.avatarUrl}
            avatarFallback={message.avatarFallback}
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
            fileName={message.file.name}
            fileSize={formatFileSize(message.file.size)}
            fileUrl={message.file.url}
            timestamp={message.timestamp}
            avatarUrl={message.avatarUrl}
            avatarFallback={message.avatarFallback}
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
          imageMessageId={message.id}
          onImageClick={handleImageClick}
          avatarUrl={message.avatarUrl}
          avatarFallback={message.avatarFallback}
          isNew={newMessageId === message.id}
        />
      );
    });
  }, [messages, newMessageId, handleImageClick]);

  // ✅ MODIFICADO: Usar typingUsers array
  const renderedTypingIndicator = useMemo(() => {
    

    return (
      <div className="flex items-start gap-2">
        <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
          <AvatarFallback className="rounded-lg text-xs">
            
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
  }, []);

  useEffect(() => {
    initialScrollAppliedRef.current = false;
    scrollMessageCountRef.current = 0;
    animationMessageCountRef.current = 0;

    if (typeof window === "undefined") return;
    const isMobileNow = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobileNow) {
      inputRef.current?.focus();
    }
  }, [ticket.id]);

  useEffect(() => {
    if (messages.length === 0) return;

    const previousCount = scrollMessageCountRef.current;
    const isInitialLoadForTicket =
      !initialScrollAppliedRef.current && previousCount === 0;

    if (isInitialLoadForTicket) {
      scrollToBottom("auto");
      initialScrollAppliedRef.current = true;
      scrollMessageCountRef.current = messages.length;
      return;
    }

    if (messages.length > previousCount) {
      scrollToBottom("smooth");
    }

    scrollMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const previousCount = animationMessageCountRef.current;

    if (messages.length > previousCount && previousCount > 0) {
      const latestMessage = messages[messages.length - 1];
      setNewMessageId(latestMessage.id);

      const timeoutId = window.setTimeout(() => setNewMessageId(null), 240);
      animationMessageCountRef.current = messages.length;

      return () => window.clearTimeout(timeoutId);
    }

    animationMessageCountRef.current = messages.length;
    return;
  }, [messages]);

  return (
    <div className="relative h-full flex flex-col overflow-hidden" {...bind}>
      {isDraggingFiles && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="rounded-lg border border-dashed border-primary bg-primary/5 px-6 py-4 text-sm">
            Solte para anexar
          </div>
        </div>
      )}

      <div className="flex items-center justify-between h-14 px-3 border-b border-border transition-colors">
        <div className="flex items-center gap-2 min-w-0 flex-1">
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
                    {ticket.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Cliente - {statusLabel} - {priorityLabel}
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
                {ticket.title}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Cliente - {statusLabel} - {priorityLabel}
              </span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
          disabled={isTicketClosed || isClosingTicket}
          onClick={handleCloseTicket}
        >
          {isClosingTicket ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Fechando
            </span>
          ) : isTicketClosed ? (
            "Ticket fechado"
          ) : (
            "Fechar ticket"
          )}
        </Button>
      </div>

      {isMobile ? (
        <div ref={mobileScrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {renderedMessages}
            {renderedTypingIndicator}
          </div>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
              <LoaderCircleIcon className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            messages.length === 0 &&
            (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none text-center leading-relaxed">
                Você pode enviar imagens ou arquivos 😉
              </div>
            )
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 relative" ref={scrollAreaRef}>
          <div className="p-4 space-y-3">
            {renderedMessages}
            {renderedTypingIndicator}
          </div>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
              <LoaderCircleIcon className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            messages.length === 0 &&
             (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none text-center leading-relaxed">
                Você pode enviar imagens ou arquivos 😉
              </div>
            )
          )}
        </ScrollArea>
      )}

      {!isTicketClosed && (
        <MessageInput
          ref={inputRef}
          onSend={sendMessage} // ✅ NOVO
          attachments={attachments}
        />
      )}

      <AttachmentViewer
        open={isAttachmentViewerOpen}
        onOpenChange={setIsAttachmentViewerOpen}
        initialIndex={selectedImageIndex}
        attachments={viewerItems}
      />
    </div>
  );
}
