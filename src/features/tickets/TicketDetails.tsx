import { useState } from "react";
import type { Ticket } from "./TicketListItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Edit2
} from "lucide-react";
import { AttachmentViewer } from "./AttachmentViewer";

type Props = {
  ticket?: Ticket | null;
};

export function TicketDetails({ ticket }: Props) {
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);

  if (!ticket) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header aligned with TicketList */}
      <div className="h-14 px-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg tracking-tight">Ticket Details</h2>

        </div>
      {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
        <MoreHorizontal className="h-4 w-4" />
      </Button> */}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">

          {/* Agent/Assignee Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src="/placeholder-agent.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs text-muted-foreground mt-1">Support Agent • Assignee</p>
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
              {/* File Item 1 */}
              <div className="flex items-start gap-3 group">
                <div className="h-10 w-10 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-blue-600 cursor-pointer">error-logs.pdf</p>
                  <p className="text-xs text-muted-foreground">Shared by Agent Lisa on May 25th</p>
                </div>
              </div>

              {/* File Item 2 */}
              <div className="flex items-start gap-3 group">
                <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-blue-600 cursor-pointer">screenshot-issue.jpg</p>
                  <p className="text-xs text-muted-foreground">Shared by You on May 25th</p>
                </div>
              </div>

              {/* File Item 3 */}
              <div className="flex items-start gap-3 group">
                <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-blue-600 cursor-pointer">invoice_2023.pdf</p>
                  <p className="text-xs text-muted-foreground">Shared by Agent Lisa on May 24th</p>
                </div>
              </div>
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
