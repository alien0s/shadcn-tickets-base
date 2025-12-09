import { useState } from "react";
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

type Props = {
  ticket?: Ticket | null;
  isDrawer?: boolean;
  onClose?: () => void;
};

export function TicketDetails({ ticket, isDrawer = false, onClose }: Props) {
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);

  if (!ticket) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header aligned with TicketList */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="font-bold text-lg tracking-tight">Ticket Details</h2>

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
                <AvatarImage src="https://64.media.tumblr.com/0083c354ff570d505c60c2cf18dcb033/4c1b076e77e7bab7-6c/s500x750/155c9551494fadb9ea8cad80bad0f757a9b89f6a.jpg" alt="Agent" />
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
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Basic Details</h4>

                <div className="grid grid-cols-[24px_1fr] gap-2 items-start text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-blue-600 hover:underline cursor-pointer">dean.taylor@gmail.com</span>

                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>+1 (555) 012-3456</span>

                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Device Info</h4>

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
              <h3 className="font-medium text-sm">Files Shared</h3>
              <button
                onClick={() => setIsAttachmentViewerOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-medium"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {/* File Item 1 - PDF */}
              <FileItem
                fileName="error-logs.pdf"
                sharedBy="Agent Lisa"
                sharedDate="May 25th"
                onClick={() => setIsAttachmentViewerOpen(true)}
              />

              {/* File Item 2 - Image */}
              <FileItem
                fileName="screenshot-issue.jpg"
                sharedBy="You"
                sharedDate="May 25th"
                onClick={() => setIsAttachmentViewerOpen(true)}
              />

              {/* File Item 3 - PDF */}
              <FileItem
                fileName="invoice_2023.pdf"
                sharedBy="Agent Lisa"
                sharedDate="May 24th"
                onClick={() => setIsAttachmentViewerOpen(true)}
              />
            </div>
          </div>

        </div>
      </ScrollArea>

      <AttachmentViewer
        open={isAttachmentViewerOpen}
        onOpenChange={setIsAttachmentViewerOpen}
        initialIndex={0}
      />
    </div>
  );
}
