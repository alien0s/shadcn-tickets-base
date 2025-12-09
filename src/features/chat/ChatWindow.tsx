import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import { MessageBubble } from "./MessageBubble";
import { AttachmentViewer } from "@/features/tickets/AttachmentViewer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Ticket } from "@/features/tickets/TicketListItem";
import { ArrowLeft } from "lucide-react";

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

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsAttachmentViewerOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header do chat */}
      <div
        className={`flex items-center justify-between h-14 px-3 border-b border-border transition-colors`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Botão de voltar - apenas mobile */}
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
                    Cliente · {ticket.status} · {ticket.priority}
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
                Cliente · {ticket.status} · {ticket.priority}
              </span>
            </div>
          )}
        </div>

        {/* Botão verde "Fechar ticket" */}
        <Button
          size="sm"
          className="bg-emerald-500 text-white hover:bg-emerald-600"
          onClick={() => {
            // TODO: integração com API para fechamento
          }}
        >
          Fechar ticket
        </Button>
      </div>

      {/* Mensagens */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Mensagem de texto recebida */}
          <MessageBubble
            type="text"
            isOwn={false}
            content="Olá, estou com um problema para acessar o sistema."
            timestamp="10:30"
          />

          {/* Mensagem de texto enviada */}
          <MessageBubble
            type="text"
            isOwn={true}
            content="Olá! Pode me enviar um print do erro que aparece?"
            timestamp="10:32"
          />

          {/* Arquivo recebido - PDF com ícone vermelho */}
          <MessageBubble
            type="file"
            isOwn={false}
            fileName="error-logs.pdf"
            fileSize="2.4 KB"
            fileUrl="#"
            timestamp="10:35"
          />

          {/* Imagem enviada - abre no viewer */}
          <MessageBubble
            type="image"
            isOwn={true}
            imageUrl="https://64.media.tumblr.com/f43536e7eaf1c5ef943e4879e44f7611/tumblr_oxg6vi8kBV1wx5fjeo1_1280.jpg"
            alt="Screenshot"
            timestamp="10:36"
            onImageClick={() => handleImageClick(0)}
          />

          {/* Arquivo enviado - PDF */}
          <MessageBubble
            type="file"
            isOwn={true}
            fileName="solution-guide.pdf"
            fileSize="1.2 MB"
            fileUrl="#"
            timestamp="10:38"
          />

          {/* Imagem recebida - abre no viewer */}
          <MessageBubble
            type="image"
            isOwn={false}
            imageUrl="https://i.pinimg.com/736x/54/ff/2f/54ff2f6e6b229c3bd0bdbdef4c4c89ad.jpg"
            alt="Error screenshot"
            timestamp="10:40"
            onImageClick={() => handleImageClick(1)}
          />
        </div>
      </ScrollArea>

      <MessageInput />

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
