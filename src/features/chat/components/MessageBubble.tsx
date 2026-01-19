import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FileItem } from "@/features/files/components/FileItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type BaseMessageProps = {
  isOwn: boolean;
  timestamp?: string;
  isNew?: boolean;

  /**
   * MOCK por enquanto.
   * Quando a API entrar, o ideal é isso vir do "message.sender".
   */
  avatarUrl?: string;
  avatarFallback?: string;
};

type TextMessageProps = BaseMessageProps & {
  type: "text";
  content: string;
};

type FileMessageProps = BaseMessageProps & {
  type: "file";
  fileName: string;
  fileSize: string;
  fileUrl?: string;
};

type ImageMessageProps = BaseMessageProps & {
  type: "image";
  imageUrl: string;
  alt?: string;
  imageMessageId: string; // ✅
  onImageClick?: (messageId: string) => void;
};

type MessageBubbleProps = TextMessageProps | FileMessageProps | ImageMessageProps;

export const MessageBubble = React.memo(function MessageBubble(
  props: MessageBubbleProps
) {
  const { isOwn, timestamp, isNew } = props;

  // Classe de animação só quando entra uma mensagem nova (efeito curto)
  const animationClass = isNew
    ? "animate-in fade-in slide-in-from-bottom-2 duration-200"
    : "";

  // Mantém fallback e avatar previsíveis (mock). No futuro vem da API.
  const { avatarUrl, avatarFallback } = useMemo(() => {
    // Se vier por props (futuro), respeita
    if (props.avatarUrl || props.avatarFallback) {
      return {
        avatarUrl: props.avatarUrl,
        avatarFallback: props.avatarFallback ?? (isOwn ? "EU" : "OP"),
      };
    }

    // Mock atual (mantém o comportamento visual que você já tinha)
    const url = isOwn
      ? "https://img.wattpad.com/21bf8fcb4e0790256056b6cc1ad4943569479292/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f7279496d6167652f354b3576414f686f516e4c3368673d3d2d3332383734303530362e313438383033353235653662663366313836333836383732303237302e6a7067?s=fit&w=720&h=720"
      : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s";

    return {
      avatarUrl: url,
      avatarFallback: isOwn ? "EU" : "OP",
    };
  }, [props.avatarUrl, props.avatarFallback, isOwn]);

  // Container geral (alinha à esquerda/direita)
  const containerClass = cn(
    "flex items-start gap-2",
    isOwn ? "justify-end" : "justify-start"
  );

  // Bolha base (cores por autor)
  const bubbleBaseClass = cn(
    "max-w-[70%] rounded-lg text-sm",
    isOwn
      ? "bg-blue-100 dark:bg-blue-950/50 text-foreground"
      : "bg-muted text-foreground"
  );

  // Avatar reutilizável (evita duplicação de markup)
  const BubbleAvatar = (
    <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
      <AvatarImage src={avatarUrl} alt="Avatar" />
      <AvatarFallback className="rounded-lg text-xs">
        {avatarFallback}
      </AvatarFallback>
    </Avatar>
  );

  // Timestamp reutilizável (evita repetir span 3x)
  const Timestamp = timestamp ? (
    <span className="text-[10px] text-muted-foreground mt-1 block">
      {timestamp}
    </span>
  ) : null;

  // Helper seguro para abrir url (evita quebrar em SSR)
  const openUrl = (url: string) => {
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer"); // evita leak de window.opener
  };

  // Conteúdo da bolha varia pelo tipo
  let content: React.ReactNode = null;

  if (props.type === "text") {
    content = (
      <>
        <p>{props.content}</p>
        {Timestamp}
      </>
    );
  } else if (props.type === "file") {
    content = (
      <>
        <FileItem
          fileName={props.fileName}
          fileSize={props.fileSize}
          variant="compact"
          showDownload={true}
          onClick={() => {
            if (props.fileUrl) openUrl(props.fileUrl);
          }}
        />
        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-2 block">
            {timestamp}
          </span>
        )}
      </>
    );
  } else if (props.type === "image") {
    content = (
      <>
        <div className="relative w-48 h-48 rounded-md overflow-hidden bg-muted">
          <img
            src={props.imageUrl}
            alt={props.alt || "Imagem"} // melhor UX pt-br
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              if (props.onImageClick) {
                props.onImageClick(props.imageMessageId);
              } else {
                openUrl(props.imageUrl);
              }
            }}

          />
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-2 block">
            {timestamp}
          </span>
        )}
      </>
    );
  }

  // Padding varia um pouco por tipo (imagem menor)
  const bubblePaddingClass =
    props.type === "image" ? "p-2 overflow-hidden" : props.type === "file" ? "p-3" : "px-3 py-2";

  return (
    <div className={containerClass}>
      {/* Avatar do outro (mensagens recebidas) */}
      {!isOwn && BubbleAvatar}

      {/* Bolha */}
      <div className={cn(bubbleBaseClass, bubblePaddingClass, animationClass)}>
        {content}
      </div>

      {/* Avatar próprio (mensagens enviadas) */}
      {isOwn && BubbleAvatar}
    </div>
  );
});
