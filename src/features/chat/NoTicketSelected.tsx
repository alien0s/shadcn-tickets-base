import React from "react";
import { NotFoundUFO } from "../../components/illustrations/NotFoundUFO";

export function NoTicketSelected() {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-muted/10 p-8 text-center animate-in fade-in duration-300">
            <div className="max-w-md flex flex-col items-center">
                {/* Ilustração SVG customizada */}
                <NotFoundUFO />

                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Nenhum ticket selecionado
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Selecione uma conversa na lista ao lado para visualizar.
                </p>
            </div>
        </div>
    );
}
