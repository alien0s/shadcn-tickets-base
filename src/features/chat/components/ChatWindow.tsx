//chatwindows.tsx tela div de chat
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import type { MessageInputHandle } from "./MessageInput";
import { MessageBubble } from "./MessageBubble";
import { AttachmentViewer } from "@/features/attachments/components/AttachmentViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Ticket } from "@/features/tickets/types/ticketTypes";
import { ArrowLeft } from "lucide-react";
import { useChatMessages } from "../hooks/useChatMessages";
import { useIsDesktopDetailsVisible } from "../hooks/useIsDesktopDetailsVisible";
import { useIsMobile } from "../hooks/useIsMobile";

type Props = {
  ticket: Ticket;
  onToggleDetails?: () => void;
  onBack?: () => void;
};

export function ChatWindow({ ticket, onToggleDetails, onBack }: Props) {
  const isDetailsVisibleOnDesktop = useIsDesktopDetailsVisible();
  const headerIsClickable = !isDetailsVisibleOnDesktop;
  const isMobile = useIsMobile();
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<MessageInputHandle>(null);
  const previousMessageCountRef = useRef(0);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);
  const { imageMessages, messages, sendMessage, typingIndicator } =
    useChatMessages();

  const scrollToBottom = () => {
    if (isMobile) {
      if (!mobileScrollRef.current) return;
      requestAnimationFrame(() => {
        if (mobileScrollRef.current) {
          mobileScrollRef.current.scrollTo({
            top: mobileScrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      });
      return;
    }

    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
    if (!viewport) return;

    requestAnimationFrame(() => {
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  };

  const handleImageClick = (messageId: string) => {
    const index = imageMessages.findIndex((m) => m.id === messageId);
    if (index === -1) return;
    setSelectedImageIndex(index);
    setIsAttachmentViewerOpen(true);
  };

  // Scroll to bottom when ticket changes.
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 0);
    if (typeof window !== "undefined") {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        inputRef.current?.focus();
      }
    }
    return () => clearTimeout(timeoutId);
  }, [ticket.id]);

  // Scroll when new messages arrive.
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 0);
    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    if (messages.length > previousCount && previousCount > 0) {
      const latestMessage = messages[messages.length - 1];
      setNewMessageId(latestMessage.id);
      const timeoutId = setTimeout(() => setNewMessageId(null), 240);
      previousMessageCountRef.current = messages.length;
      return () => clearTimeout(timeoutId);
    }
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!isMobile) return;
    const timeoutId = setTimeout(scrollToBottom, 0);
    return () => clearTimeout(timeoutId);
  }, [isMobile, ticket.id]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header do chat */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border transition-colors">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Botao de voltar - apenas mobile */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
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

        {/* Botao verde "Fechar ticket" */}
        <Button
          size="sm"
          className="bg-emerald-500 text-white hover:bg-emerald-600"
          onClick={() => {
            // TODO: integracao com API para fechamento
          }}
        >
          Fechar ticket
        </Button>
      </div>

      {/* Mensagens */}
      {isMobile ? (
        <div ref={mobileScrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {messages.map((message) => {
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
                    fileName={message.fileName}
                    fileSize={message.fileSize}
                    fileUrl={message.fileUrl}
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
                  imageUrl={message.imageUrl}
                  alt={message.alt}
                  timestamp={message.timestamp}
                  onImageClick={() => handleImageClick(message.id)}
                  isNew={newMessageId === message.id}
                />
              );
            })}

            {typingIndicator.isTyping && (
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
            )}
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="p-4 space-y-3">
            {messages.map((message) => {
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
                    fileName={message.fileName}
                    fileSize={message.fileSize}
                    fileUrl={message.fileUrl}
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
                  imageUrl={message.imageUrl}
                  alt={message.alt}
                  timestamp={message.timestamp}
                  onImageClick={() => handleImageClick(message.id)}
                  isNew={newMessageId === message.id}
                />
              );
            })}

            {typingIndicator.isTyping && (
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
            )}
          </div>
        </ScrollArea>
      )}

      <MessageInput ref={inputRef} onSend={sendMessage} />

      {/* AttachmentViewer para imagens do chat */}
      <AttachmentViewer
        open={isAttachmentViewerOpen}
        onOpenChange={setIsAttachmentViewerOpen}
        initialIndex={selectedImageIndex}
      />
    </div>
  );
}
