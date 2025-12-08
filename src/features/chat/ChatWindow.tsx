import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import type { Ticket } from "@/features/tickets/TicketListItem";

type Props = {
  ticket: Ticket;
  onToggleDetails?: () => void;
};

export function ChatWindow({ ticket, onToggleDetails }: Props) {
  const isDetailsVisibleOnDesktop = useIsDesktopDetailsVisible();
  const headerIsClickable = !isDetailsVisibleOnDesktop;

  return (
    <div className="h-full flex flex-col">
      {/* Header do chat */}
      <div
        className={`flex items-center justify-between h-14 px-3 border-b border-border transition-colors ${headerIsClickable ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
        onClick={headerIsClickable ? onToggleDetails : undefined}
        title={headerIsClickable ? "View details" : undefined}
      >
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
