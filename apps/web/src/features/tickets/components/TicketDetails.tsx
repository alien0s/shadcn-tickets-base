import { useEffect, useMemo, useRef, useState } from "react";
import type { Ticket } from "../types/ticketTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileItem } from "@/features/files/components/FileItem";
import { Mail, Phone, X } from "lucide-react";
import { AttachmentViewer } from "@/features/attachments/components/AttachmentViewer";
import { AllAttachmentsDialog } from "@/features/attachments/components/AllAttachmentsDialog";
import type { AttachmentItem } from "@/features/attachments/types/attachmentTypes";
import { BASE_DOCUMENTS, FALLBACK_IMAGES } from "../data/mockTicketAttachments";
import type { AttachmentViewerItem } from "@/features/attachments/components/AttachmentViewer";

/**
 * ✅ Cache em memória (por sessão) para NÃO refazer fetch e NÃO re-triggerar shimmer toda vez.
 * - attachmentsCache: guarda a lista final de imagens por ticketId
 * - loadedTicketIds: marca ticketIds que já passaram pela "primeira carga" (mesmo que fallback)
 */
const attachmentsCache = new Map<string, AttachmentItem[]>();
const loadedTicketIds = new Set<string>();

type Props = {
  ticket?: Ticket | null;
  isDrawer?: boolean;
  onClose?: () => void;
};

export function TicketDetails({ ticket, isDrawer = false, onClose }: Props) {
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [isAllAttachmentsOpen, setIsAllAttachmentsOpen] = useState(false);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);

  /**
   * ⚠️ Importante:
   * - NÃO iniciamos como null, porque isso faz "sumir tudo" e aparecer de uma vez (efeito ruim).
   * - Começamos com FALLBACK_IMAGES (thumbs já renderizam), e só trocamos quando o fetch terminar.
   */
  const [imageAttachments, setImageAttachments] =
    useState<AttachmentItem[]>(FALLBACK_IMAGES);

  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

  // Mantém referência do ticketId atual para evitar race (ticket troca rápido)
  const activeTicketIdRef = useRef<string | null>(null);

  // Estado "primeira vez" por ticket (controla shimmer no thumbnail)
  const isFirstLoadForTicket = ticket?.id ? !loadedTicketIds.has(ticket.id) : false;

  useEffect(() => {
    if (!ticket?.id) return;

    const ticketId = ticket.id;
    activeTicketIdRef.current = ticketId;

    // ✅ Se já existe cache: usa imediatamente e não mostra loading
    const cached = attachmentsCache.get(ticketId);
    if (cached) {
      setImageAttachments(cached);
      setIsLoadingAttachments(false);
      loadedTicketIds.add(ticketId); // já foi "carregado" uma vez
      return;
    }

    // ✅ Primeira vez sem cache:
    // - mantém FALLBACK_IMAGES visíveis (não some o conteúdo)
    // - liga loading (para o "Ver todos" / dialog)
    setImageAttachments(FALLBACK_IMAGES);
    setIsLoadingAttachments(true);

    let isMounted = true;

    const loadPhotos = async () => {
      try {
        const response = await fetch(
          "https://picsum.photos/v2/list?page=2&limit=12"
        );
        if (!response.ok) throw new Error("Erro ao buscar fotos");

        const data: { id: string; author: string }[] = await response.json();

        // Se ticket mudou enquanto carregava, ignora resultado (anti-race)
        if (!isMounted) return;
        if (activeTicketIdRef.current !== ticketId) return;

        const photos: AttachmentItem[] = data.map((photo) => ({
          fileName: `${(photo.author || "photo")
            .trim()
            .replace(/\s+/g, "-")
            .toLowerCase()}-${photo.id}.jpg`,
          fileType: "image",
          previewUrl: `https://picsum.photos/id/${photo.id}/600/600`,
        }));

        attachmentsCache.set(ticketId, photos);
        setImageAttachments(photos);
      } catch (error) {
        // ✅ fallback também entra em cache para não "tentar de novo" sempre
        attachmentsCache.set(ticketId, FALLBACK_IMAGES);
        setImageAttachments(FALLBACK_IMAGES);
      } finally {
        if (!isMounted) return;
        if (activeTicketIdRef.current !== ticketId) return;

        setIsLoadingAttachments(false);
        loadedTicketIds.add(ticketId); // ✅ depois da primeira carga, nunca mais shimmer “global”
      }
    };

    loadPhotos();

    return () => {
      isMounted = false;
    };
  }, [ticket?.id]);

  const attachments = useMemo<AttachmentItem[]>(
    () => [...imageAttachments, ...BASE_DOCUMENTS],
    [imageAttachments]
  );

  const viewerItems = useMemo<AttachmentViewerItem[]>(
    () =>
      attachments.map((a) => ({
        id: a.fileName,
        type: a.fileType === "image" ? "image" : "file",
        url: a.previewUrl ?? "",
        name: a.fileName,
      })),
    [attachments]
  );

  if (!ticket) return null;

  return (
    <div className="h-full flex flex-col bg-background border-l border-border max-[767px]:border-l-0 max-[767px]:border-0">
      {/* Header aligned with TicketList */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="font-bold text-lg tracking-tight">Detalhes do Ticket</h2>

        {/* Close button - only visible in drawer mode */}
        {isDrawer && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,hsl(var(--foreground))_15%,transparent)]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Agent/Assignee Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage
                  src="https://64.media.tumblr.com/ebaf34fe31ba5feaf8316df5a65aa07b/72000c6030712841-e7/s400x600/4403d5bf9f67399659bf990b255703d85a96f5cb.jpg"
                  alt="Agent"
                />
                <AvatarFallback className="rounded-lg">JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Trabalhando neste ticket
                </p>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-md border border-border">
              <p className="text-sm text-foreground">
                Customer is reporting an issue with the payment gateway on the
                checkout page. Error code: 402.
              </p>
            </div>
          </div>

          {/* Visitor Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Detalhes do Solicitante
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contato
                </h4>

                <div className="grid grid-cols-[24px_1fr] gap-2 items-start text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-blue-600 hover:underline cursor-pointer">
                    dean.taylor@gmail.com
                  </span>

                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>+1 (555) 012-3456</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dispositivo
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">OS</span>
                    <span className="font-medium">Windows 10</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-muted-foreground text-xs">
                      Browser
                    </span>
                    <span className="font-medium">Mozilla Firefox 112.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Files Shared */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Anexos</h3>
              <button
                type="button"
                onClick={() => setIsAllAttachmentsOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-medium"
              >
                Ver todos
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {attachments.slice(0, 3).map((file, index) => (
                <div
                  key={`${file.fileName}-${index}`}
                  className="rounded-md border border-border bg-background hover:border-primary/40 transition-colors p-2"
                >
                  <FileItem
                    fileName={file.fileName}
                    fileType={file.fileType}
                    previewUrl={file.previewUrl}
                    variant="tile"
                    /**
                     * ✅ Regra do shimmer:
                     * - Só na PRIMEIRA vez do ticket (isFirstLoadForTicket = true)
                     * - Depois disso, reabrir não mostra shimmer nem "pisca"
                     */
                    withSkeleton={isFirstLoadForTicket}
                    onClick={() => {
                      setSelectedAttachmentIndex(index);
                      setIsAttachmentViewerOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <AttachmentViewer
        open={isAttachmentViewerOpen}
        onOpenChange={setIsAttachmentViewerOpen}
        initialIndex={selectedAttachmentIndex}
        attachments={viewerItems}
      />

      <AllAttachmentsDialog
        open={isAllAttachmentsOpen}
        onOpenChange={setIsAllAttachmentsOpen}
        attachments={attachments}
        /**
         * ✅ Loading do dialog:
         * - Só mostra "carregando" enquanto busca REAL na primeira vez.
         * - Em reaberturas do mesmo ticket, é sempre false (cache).
         */
        isLoading={isFirstLoadForTicket && isLoadingAttachments}
        onAttachmentClick={(index) => {
          setSelectedAttachmentIndex(index);
          setIsAttachmentViewerOpen(true);
        }}
      />
    </div>
  );
}
