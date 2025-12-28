import { useEffect, useMemo, useState } from "react";
import type { Ticket } from "./TicketListItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileItem } from "@/components/FileItem";
import {
  Mail,
  Phone,
  X
} from "lucide-react";
import { AttachmentViewer } from "./AttachmentViewer";
import { AllAttachmentsDialog } from "./AllAttachmentsDialog";

type AttachmentItem = { fileName: string; fileType: "pdf" | "image" | "document"; previewUrl?: string };

const BASE_DOCUMENTS: AttachmentItem[] = [
  { fileName: "error-logs.pdf", fileType: "pdf" },
  { fileName: "invoice_2023.pdf", fileType: "pdf" },
  { fileName: "solution-guide.docx", fileType: "document" },
  { fileName: "user-story.docx", fileType: "document" },
  { fileName: "api-reference.pdf", fileType: "pdf" },
  { fileName: "design-notes.docx", fileType: "document" },
];

const FALLBACK_IMAGES: AttachmentItem[] = [
  { fileName: "screenshot-issue.jpg", fileType: "image", previewUrl: "https://picsum.photos/seed/issue-thumb/320/320" },
  { fileName: "user-journey-recording.png", fileType: "image", previewUrl: "https://picsum.photos/seed/journey-thumb/320/320" },
  { fileName: "console-capture.png", fileType: "image", previewUrl: "https://picsum.photos/seed/console-thumb/320/320" },
  { fileName: "payment-flow.png", fileType: "image", previewUrl: "https://picsum.photos/seed/payment-flow/320/320" },
  { fileName: "cart-view.png", fileType: "image", previewUrl: "https://picsum.photos/seed/cart-view/320/320" },
  { fileName: "shipping-error.png", fileType: "image", previewUrl: "https://picsum.photos/seed/shipping-error/320/320" },
  { fileName: "mobile-checkout.png", fileType: "image", previewUrl: "https://picsum.photos/seed/mobile-checkout/320/320" },
  { fileName: "refund-steps.png", fileType: "image", previewUrl: "https://picsum.photos/seed/refund-steps/320/320" },
  { fileName: "dashboard-stats.png", fileType: "image", previewUrl: "https://picsum.photos/seed/dashboard-stats/320/320" },
];

type Props = {
  ticket?: Ticket | null;
  isDrawer?: boolean;
  onClose?: () => void;
};

export function TicketDetails({ ticket, isDrawer = false, onClose }: Props) {
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [isAllAttachmentsOpen, setIsAllAttachmentsOpen] = useState(false);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
  const [imageAttachments, setImageAttachments] = useState<AttachmentItem[]>(FALLBACK_IMAGES);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPhotos = async () => {
      try {
        const response = await fetch("https://picsum.photos/v2/list?page=2&limit=12");
        if (!response.ok) {
          throw new Error("Erro ao buscar fotos");
        }

        const data: { id: string; author: string }[] = await response.json();
        if (!isMounted) return;

        const photos = data.map<AttachmentItem>((photo) => ({
          fileName: `${(photo.author || "photo").trim().replace(/\s+/g, "-").toLowerCase()}-${photo.id}.jpg`,
          fileType: "image",
          previewUrl: `https://picsum.photos/id/${photo.id}/600/600`,
        }));

        setImageAttachments(photos);
      } catch (error) {
        console.error("Erro ao carregar fotos reais", error);
        if (isMounted) {
          setImageAttachments(FALLBACK_IMAGES);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAttachments(false);
        }
      }
    };

    loadPhotos();

    return () => {
      isMounted = false;
    };
  }, []);

  const attachments = useMemo(
    () => [...imageAttachments, ...BASE_DOCUMENTS],
    [imageAttachments]
  );

  if (!ticket) {
    return null;
  }

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
                <AvatarImage src="https://64.media.tumblr.com/ebaf34fe31ba5feaf8316df5a65aa07b/72000c6030712841-e7/s400x600/4403d5bf9f67399659bf990b255703d85a96f5cb.jpg" alt="Agent" />
                <AvatarFallback className="rounded-lg">JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs text-muted-foreground mt-1">Trabalhando neste ticket</p>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-md border border-border">
              <p className="text-sm text-foreground">
                Customer is reporting an issue with the payment gateway on the checkout page. Error code: 402.
              </p>
            </div>
          </div>



          {/* Visitor Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Detalhes do Solicitante</h3>

            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contato</h4>

                <div className="grid grid-cols-[24px_1fr] gap-2 items-start text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-blue-600 hover:underline cursor-pointer">dean.taylor@gmail.com</span>

                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>+1 (555) 012-3456</span>

                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dispositivo</h4>

                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">

                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">OS</span>
                    <span className="font-medium">Windows 10</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-muted-foreground text-xs">Browser</span>
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
                    withSkeleton
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
      />

      <AllAttachmentsDialog
        open={isAllAttachmentsOpen}
        onOpenChange={setIsAllAttachmentsOpen}
        attachments={attachments}
        isLoading={isLoadingAttachments}
        onAttachmentClick={(index) => {
          setSelectedAttachmentIndex(index);
          setIsAttachmentViewerOpen(true);
        }}
      />
    </div>
  );
}
