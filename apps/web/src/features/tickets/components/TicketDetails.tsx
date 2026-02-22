import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ticket } from "../types/ticketTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileItem } from "@/features/files/components/FileItem";
import { Mail, Phone, X } from "lucide-react";
import { AttachmentViewer } from "@/features/attachments/components/AttachmentViewer";
import { AllAttachmentsDialog } from "@/features/attachments/components/AllAttachmentsDialog";
import type { AttachmentItem } from "@/features/attachments/types/attachmentTypes";
import type { AttachmentViewerItem } from "@/features/attachments/components/AttachmentViewer";
import { api } from "@/lib/api";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * ✅ Cache em memória (por sessão) para NÃO refazer fetch e NÃO re-triggerar shimmer toda vez.
 * - attachmentsCache: guarda a lista final de imagens por ticketId
 * - loadedTicketIds: marca ticketIds que já passaram pela "primeira carga" (mesmo que fallback)
 */
const attachmentsCache = new Map<string, AttachmentItem[]>();
const loadedTicketIds = new Set<string>();
const ticketDetailsCache = new Map<
  string,
  {
    assignedToUserId: string | null;
    agentName: string | null;
    agentAvatarUrl: string | null;
    subject: string | null;
    os: string | null;
    browser: string | null;
    requesterEmail: string | null;
  }
>();
const agentProfileCache = new Map<
  string,
  { id: string; name: string; avatar_url?: string | null }
>();

function withAvatarVersion(url?: string | null, version?: string | number) {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  const token = String(version ?? Date.now());
  return `${url}${separator}v=${token}`;
}

type ApiTicketDetail = {
  id: string;
  subject: string;
  updated_at?: string;
  assigned_to: {
    id: string;
    name: string;
    avatar_url?: string | null;
  } | null;
  requester?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  os?: {
    id: number;
    name: string;
    version: string | null;
    family: string;
  } | null;
  browser?: string | null;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    preview_url?: string | null;
    file_size?: number | null;
    uploaded_at?: string;
  }>;
};

type TicketMessageCreatedDetail = {
  ticketId: string;
};

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
    useState<AttachmentItem[]>([]);

  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentAvatarUrl, setAgentAvatarUrl] = useState<string | null>(null);
  const [agentUserId, setAgentUserId] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState<string | null>(null);
  const [ticketOs, setTicketOs] = useState<string | null>(null);
  const [ticketBrowser, setTicketBrowser] = useState<string | null>(null);
  const [requesterEmail, setRequesterEmail] = useState<string | null>(null);

  // Mantém referência do ticketId atual para evitar race (ticket troca rápido)
  const activeTicketIdRef = useRef<string | null>(null);

  // Estado "primeira vez" por ticket (controla shimmer no thumbnail)
  const isFirstLoadForTicket = ticket?.id ? !loadedTicketIds.has(ticket.id) : false;
  const hasAgent = Boolean(agentName);
  const [isTicketClosed, setIsTicketClosed] = useState(
    ticket?.status === "closed" || ticket?.status === "fechado"
  );

  const refreshAssignedAgent = useCallback(async (ticketId: string) => {
    try {
      const data = await api.get<ApiTicketDetail>(`/tickets/${ticketId}`);
      if (activeTicketIdRef.current !== ticketId) return;

      const nextAgentUserId = data.assigned_to?.id ?? null;
      const nextAgentName = data.assigned_to?.name ?? null;
      const nextAgentAvatar = withAvatarVersion(
        data.assigned_to?.avatar_url ?? null,
        data.updated_at
      );

      setAgentUserId(nextAgentUserId);
      setAgentName(nextAgentName);
      setAgentAvatarUrl(nextAgentAvatar);

      if (nextAgentUserId && nextAgentName) {
        agentProfileCache.set(nextAgentUserId, {
          id: nextAgentUserId,
          name: nextAgentName,
          avatar_url: nextAgentAvatar,
        });
      }

      const cachedDetails = ticketDetailsCache.get(ticketId);
      if (cachedDetails) {
        ticketDetailsCache.set(ticketId, {
          ...cachedDetails,
          assignedToUserId: nextAgentUserId,
          agentName: nextAgentName,
          agentAvatarUrl: nextAgentAvatar,
        });
      }
      return Boolean(nextAgentUserId);
    } catch (error) {
      console.error("Erro ao atualizar assignee do ticket:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!ticket?.id) return;

    const ticketId = ticket.id;
    activeTicketIdRef.current = ticketId;

    setTicketSubject(ticket.subject ?? null);

    // ✅ Se já existe cache: usa imediatamente e não mostra loading
    const cached = attachmentsCache.get(ticketId);
    if (cached) {
      setImageAttachments(cached);
      setIsLoadingAttachments(false);
      loadedTicketIds.add(ticketId); // já foi "carregado" uma vez

      const cachedDetails = ticketDetailsCache.get(ticketId);
      if (cachedDetails) {
        setAgentUserId(cachedDetails.assignedToUserId);
        setAgentName(cachedDetails.agentName);
        setAgentAvatarUrl(cachedDetails.agentAvatarUrl);
        setTicketSubject(cachedDetails.subject ?? ticket.subject ?? null);
        setTicketOs(cachedDetails.os);
        setTicketBrowser(cachedDetails.browser);
        setRequesterEmail(cachedDetails.requesterEmail);
      }

      return;
    }

    let isMounted = true;

    const loadPhotos = async () => {
      try {
        setIsLoadingAttachments(true);

        const data = await api.get<ApiTicketDetail>(`/tickets/${ticketId}`);

        if (!isMounted) return;
        if (activeTicketIdRef.current !== ticketId) return;

        const nextAgentName = data.assigned_to?.name ?? null;
        const nextAgentAvatarUrl = withAvatarVersion(
          data.assigned_to?.avatar_url ?? null,
          data.updated_at
        );
        const nextAgentUserId = data.assigned_to?.id ?? null;
        const nextSubject = data.subject ?? ticket.subject ?? null;
        const nextOs = data.os
          ? `${data.os.name}${data.os.version ? ` ${data.os.version}` : ""}`
          : null;
        const nextBrowser = data.browser ?? null;
        const nextRequesterEmail = data.requester?.email ?? null;

        setAgentUserId(nextAgentUserId);
        setAgentName(nextAgentName);
        setAgentAvatarUrl(nextAgentAvatarUrl);
        setTicketSubject(nextSubject);
        setTicketOs(nextOs);
        setTicketBrowser(nextBrowser);
        setRequesterEmail(nextRequesterEmail);

        const files = (data.attachments ?? []).map<AttachmentItem>((file) => {
          const lowerType = (file.type ?? "").toLowerCase();
          const isImage = lowerType.startsWith("image/");
          const isPdf = lowerType === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
          const url = file.url?.startsWith("/uploads/")
            ? `${UPLOADS_BASE_URL}${file.url}`
            : file.url;
          const previewUrl = file.preview_url?.startsWith("/uploads/")
            ? `${UPLOADS_BASE_URL}${file.preview_url}`
            : file.preview_url;

          return {
            fileName: file.name,
            fileType: isImage ? "image" : isPdf ? "pdf" : "document",
            previewUrl: isImage ? (previewUrl ?? url) : undefined,
          };
        });

        attachmentsCache.set(ticketId, files);
        ticketDetailsCache.set(ticketId, {
          assignedToUserId: nextAgentUserId,
          agentName: nextAgentName,
          agentAvatarUrl: nextAgentAvatarUrl,
          subject: nextSubject,
          os: nextOs,
          browser: nextBrowser,
          requesterEmail: nextRequesterEmail,
        });
        if (nextAgentUserId && nextAgentName) {
          agentProfileCache.set(nextAgentUserId, {
            id: nextAgentUserId,
            name: nextAgentName,
            avatar_url: nextAgentAvatarUrl,
          });
        }
        setImageAttachments(files);
      } catch (error) {
        attachmentsCache.set(ticketId, []);
        setImageAttachments([]);
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

  useEffect(() => {
    if (!ticket?.id || !isSupabaseConfigured || !supabase) return;
    const client = supabase;
    const ticketId = ticket.id;

    const channel = client
      .channel(`ticket-details:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        async (payload: any) => {
          const row = payload.new as {
            id?: string;
            assigned_to_user_id?: string | null;
          };
          if (!row?.id || row.id !== ticketId) return;
          if (activeTicketIdRef.current !== ticketId) return;

          const nextAssignedToUserId = row.assigned_to_user_id ?? null;
          if (nextAssignedToUserId === agentUserId) return;

          if (!nextAssignedToUserId) {
            setAgentUserId(null);
            setAgentName(null);
            setAgentAvatarUrl(null);
            ticketDetailsCache.set(ticketId, {
              assignedToUserId: null,
              agentName: null,
              agentAvatarUrl: null,
              subject: ticketSubject,
              os: ticketOs,
              browser: ticketBrowser,
              requesterEmail,
            });
            return;
          }

          const cachedAgent = agentProfileCache.get(nextAssignedToUserId);
          if (cachedAgent) {
            setAgentUserId(cachedAgent.id);
            setAgentName(cachedAgent.name);
            setAgentAvatarUrl(withAvatarVersion(cachedAgent.avatar_url ?? null));
            ticketDetailsCache.set(ticketId, {
              assignedToUserId: cachedAgent.id,
              agentName: cachedAgent.name,
              agentAvatarUrl: withAvatarVersion(cachedAgent.avatar_url ?? null),
              subject: ticketSubject,
              os: ticketOs,
              browser: ticketBrowser,
              requesterEmail,
            });
            return;
          }

          try {
            const data = await api.get<{
              id: string;
              name: string;
              avatar_url?: string | null;
            }>(`/users/${nextAssignedToUserId}`);

            agentProfileCache.set(nextAssignedToUserId, data);
            if (activeTicketIdRef.current !== ticketId) return;

            setAgentUserId(data.id);
            setAgentName(data.name ?? null);
            setAgentAvatarUrl(withAvatarVersion(data.avatar_url ?? null));
            ticketDetailsCache.set(ticketId, {
              assignedToUserId: data.id,
              agentName: data.name ?? null,
              agentAvatarUrl: withAvatarVersion(data.avatar_url ?? null),
              subject: ticketSubject,
              os: ticketOs,
              browser: ticketBrowser,
              requesterEmail,
            });
          } catch (error) {
            console.error("Erro ao atualizar agente do ticket:", error);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [ticket?.id, agentUserId, ticketSubject, ticketOs, ticketBrowser, requesterEmail]);

  useEffect(() => {
    if (!ticket?.id || !agentUserId || !isSupabaseConfigured || !supabase) return;
    const client = supabase;
    const ticketId = ticket.id;
    const currentAgentId = agentUserId;

    const channel = client
      .channel(`ticket-agent-profile:${ticketId}:${currentAgentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${currentAgentId}`,
        },
        (payload: any) => {
          const row = payload.new as {
            id?: string;
            name?: string | null;
            avatar_url?: string | null;
            updated_at?: string | null;
          };
          if (!row?.id || row.id !== currentAgentId) return;
          if (activeTicketIdRef.current !== ticketId) return;

          const nextName = row.name ?? null;
          const nextAvatar = withAvatarVersion(row.avatar_url ?? null, row.updated_at);

          setAgentName(nextName);
          setAgentAvatarUrl(nextAvatar);
          agentProfileCache.set(currentAgentId, {
            id: currentAgentId,
            name: nextName ?? "",
            avatar_url: nextAvatar,
          });

          const cachedDetails = ticketDetailsCache.get(ticketId);
          if (cachedDetails) {
            ticketDetailsCache.set(ticketId, {
              ...cachedDetails,
              assignedToUserId: currentAgentId,
              agentName: nextName,
              agentAvatarUrl: nextAvatar,
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [ticket?.id, agentUserId]);

  useEffect(() => {
    if (!ticket?.id || !isSupabaseConfigured || !supabase) return;
    const client = supabase;
    const ticketId = ticket.id;

    const channel = client
      .channel(`ticket-details-messages:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          // Fallback com retry curto para cobrir atraso entre update do ticket e leitura no frontend.
          const attemptRefresh = async (attempt = 0) => {
            const hasAssignee = await refreshAssignedAgent(ticketId);
            if (hasAssignee || attempt >= 2) return;

            const delays = [180, 550, 1100];
            window.setTimeout(() => {
              attemptRefresh(attempt + 1);
            }, delays[attempt] ?? 550);
          };

          attemptRefresh(0);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [ticket?.id, refreshAssignedAgent]);

  useEffect(() => {
    if (!ticket?.id) return;
    const ticketId = ticket.id;

    const handleTicketMessageCreated = (event: Event) => {
      const { detail } = event as CustomEvent<TicketMessageCreatedDetail>;
      if (!detail?.ticketId || detail.ticketId !== ticketId) return;
      if (agentUserId) return;

      window.setTimeout(() => {
        refreshAssignedAgent(ticketId);
      }, 120);
    };

    window.addEventListener("ticket-message-created", handleTicketMessageCreated);
    return () => {
      window.removeEventListener("ticket-message-created", handleTicketMessageCreated);
    };
  }, [ticket?.id, agentUserId, refreshAssignedAgent]);

  useEffect(() => {
    setIsTicketClosed(ticket?.status === "closed" || ticket?.status === "fechado");
  }, [ticket?.id, ticket?.status]);

  useEffect(() => {
    if (!ticket?.id) return;
    const ticketId = ticket.id;

    const handleTicketClosed = (event: Event) => {
      const { detail } = event as CustomEvent<{ ticketId?: string }>;
      if (!detail?.ticketId || detail.ticketId !== ticketId) return;
      setIsTicketClosed(true);
    };

    window.addEventListener("ticket-closed", handleTicketClosed);
    return () => {
      window.removeEventListener("ticket-closed", handleTicketClosed);
    };
  }, [ticket?.id]);

  const attachments = useMemo<AttachmentItem[]>(() => imageAttachments, [imageAttachments]);
  const hasAttachments = attachments.length > 0;
  const hasDeviceInfo = Boolean(ticketOs || ticketBrowser);

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
            {hasAgent ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage
                    src={agentAvatarUrl ?? undefined}
                    alt={agentName ?? "Agent"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {(agentName || "AG").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {agentName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTicketClosed
                      ? "Fechou este ticket"
                      : "Trabalhando neste ticket"}
                  </p>
                </div>
              </div>
            ) : isLoadingAttachments ? (
              <div className="flex items-center gap-3" aria-hidden="true">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ) : null}

            <div className="bg-muted/30 p-3 rounded-md border border-border">
              <p className="text-sm text-foreground">
                {ticketSubject ?? ticket.subject}
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
                    {requesterEmail ? (
                      requesterEmail
                    ) : (
                      <Skeleton className="h-4 w-40" />
                    )}
                  </span>

                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>+1 (555) 012-3456</span>
                </div>
              </div>

              {hasDeviceInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Dispositivo
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">OS</span>
                    <span className="font-medium">
                      {ticketOs ? (
                        ticketOs
                      ) : (
                        <Skeleton className="h-4 w-28" />
                      )}
                    </span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-muted-foreground text-xs">
                        Browser
                      </span>
                      <span className="font-medium">
                        {ticketBrowser ? (
                          ticketBrowser
                        ) : (
                          <Skeleton className="h-4 w-48" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Files Shared */}
          {hasAttachments ? (
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
          ) : null}
        </div>
      </ScrollArea>

      {hasAttachments ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
