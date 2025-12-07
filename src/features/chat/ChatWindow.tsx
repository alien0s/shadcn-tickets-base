import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import type { Ticket } from "@/features/tickets/TicketListItem";

type Props = {
  ticket: Ticket;
};

export function ChatWindow({ ticket }: Props) {
  return (
    <div className="h-full flex flex-col">
      {/* Header do chat */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">
            {ticket.subject}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Cliente · {ticket.status} · {ticket.priority}
          </span>
        </div>

        {/* Botão verde "Fechar ticket" */}
        <Button
          size="sm"
          className="bg-emerald-500 text-white hover:bg-emerald-600"
          // TODO: integração com API para fechamento
          onClick={() => {
            // ação futura
          }}
        >
          Fechar ticket
        </Button>
      </div>

      {/* Mensagens */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg bg-muted px-3 py-2 text-sm">
              Olá, estou com um problema para acessar o sistema.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[70%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm">
              Olá! Pode me enviar um print do erro que aparece?
            </div>
          </div>
        </div>
      </ScrollArea>

      <MessageInput />
    </div>
  );
}
