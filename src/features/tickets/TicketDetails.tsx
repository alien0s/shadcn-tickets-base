import React from "react";

export function TicketDetails() {
  return (
    <div className="h-full border-l border-border bg-muted/10 px-3 py-3">
      {/* Esqueleto: vamos detalhar depois */}
      <div className="text-sm font-semibold mb-2">
        Detalhes do ticket
      </div>
      <div className="text-xs text-muted-foreground">
        Aqui entraremos com:
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Dados do cliente</li>
          <li>Status, prioridade, tags</li>
          <li>Timeline de eventos</li>
          <li>Campos personalizados da sua API</li>
        </ul>
      </div>
    </div>
  );
}
