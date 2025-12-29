import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import type { MessageInputHandle } from "./MessageInput";
import { MessageBubble } from "./MessageBubble";
import { AttachmentViewer } from "@/features/tickets/AttachmentViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Ticket } from "@/features/tickets/TicketListItem";
import { ArrowLeft } from "lucide-react";

type ChatMessage =
  | { id: string; type: "text"; isOwn: boolean; content: string; timestamp: string }
  | { id: string; type: "file"; isOwn: boolean; fileName: string; fileSize: string; fileUrl: string; timestamp: string }
  | { id: string; type: "image"; isOwn: boolean; imageUrl: string; alt: string; timestamp: string };

type TypingIndicator = {
  isTyping: boolean;
  avatarUrl: string;
  fallback: string;
  name?: string;
};

type Props = {
  ticket: Ticket;
  onToggleDetails?: () => void;
  onBack?: () => void;
};

export function ChatWindow({ ticket, onToggleDetails, onBack }: Props) {
  const isDetailsVisibleOnDesktop = useIsDesktopDetailsVisible();
  const headerIsClickable = !isDetailsVisibleOnDesktop;
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<MessageInputHandle>(null);
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({
    isTyping: true, // TODO: wire real typing signal from API
    avatarUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s",
    fallback: "OP",
    name: "Cliente",
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "1", type: "text", isOwn: false, content: "Ola, estou com um problema para acessar o sistema.", timestamp: "10:30" },
    { id: "2", type: "text", isOwn: true, content: "Ola! Pode me enviar um print do erro que aparece?", timestamp: "10:32" },
    { id: "3", type: "file", isOwn: false, fileName: "error-logs.pdf", fileSize: "2.4 KB", fileUrl: "#", timestamp: "10:35" },
    { id: "4", type: "image", isOwn: true, imageUrl: "https://64.media.tumblr.com/f43536e7eaf1c5ef943e4879e44f7611/tumblr_oxg6vi8kBV1wx5fjeo1_1280.jpg", alt: "Screenshot", timestamp: "10:36" },
    { id: "5", type: "file", isOwn: true, fileName: "solution-guide.pdf", fileSize: "1.2 MB", fileUrl: "#", timestamp: "10:38" },
    { id: "6", type: "image", isOwn: false, imageUrl: "https://i.pinimg.com/736x/54/ff/2f/54ff2f6e6b229c3bd0bdbdef4c4c89ad.jpg", alt: "Error screenshot", timestamp: "10:40" },
  ]);

  const imageMessages = messages.filter((m): m is Extract<ChatMessage, { type: "image" }> => m.type === "image");

  const scrollToBottom = () => {
    if (!viewportRef.current) return;
    requestAnimationFrame(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    });
  };

  const handleImageClick = (messageId: string) => {
    const index = imageMessages.findIndex((m) => m.id === messageId);
    if (index === -1) return;
    setSelectedImageIndex(index);
    setIsAttachmentViewerOpen(true);
  };

  const handleSendMessage = (payload: { text: string; files: { name: string; sizeLabel: string; url: string; kind: "image" | "file" }[] }) => {
    const { text, files } = payload;
    if (!text && files.length === 0) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  // Cache viewport element once to avoid repeated querySelector/layout
  useEffect(() => {
    if (scrollAreaRef.current) {
      viewportRef.current = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLDivElement | null;
    }
  }, [ticket.id]);

  // Scroll to bottom when ticket changes
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

  // Scroll when new messages arrive
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 0);
    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  // Auto-hide typing indicator after a short idle period to avoid constant animations
  useEffect(() => {
    if (!typingIndicator.isTyping) return;
    const timer = setTimeout(() => {
      setTypingIndicator((prev) => ({ ...prev, isTyping: false }));
    }, 2500);
    return () => clearTimeout(timer);
  }, [typingIndicator.isTyping]);

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
              />
            );
          })}

          {typingIndicator.isTyping && (
            <div className="flex items-start gap-2">
              <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
                <AvatarImage src={typingIndicator.avatarUrl} alt={typingIndicator.name || "Outro participante"} />
                <AvatarFallback className="rounded-lg text-xs">{typingIndicator.fallback}</AvatarFallback>
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

      <MessageInput ref={inputRef} onSend={handleSendMessage} />

      {/* AttachmentViewer para imagens do chat */}
      <AttachmentViewer
        open={isAttachmentViewerOpen}
        onOpenChange={setIsAttachmentViewerOpen}
        initialIndex={selectedImageIndex}
      />
    </div>
  );
}

function useIsDesktopDetailsVisible() {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1280px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Set the initial value in case it changed between renders
    setMatches(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  return matches;
}
