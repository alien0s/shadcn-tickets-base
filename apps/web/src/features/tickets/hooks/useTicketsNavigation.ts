import { useCallback, useEffect, useRef, useState } from "react";
import type { Ticket } from "../types/ticketTypes";

interface UseTicketsNavigationProps {
  isMobile: boolean;
}

export function useTicketsNavigation({ isMobile }: UseTicketsNavigationProps) {
  // Estados principais para controle da navegação
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // Refs para rastrear estados anteriores (usados para detectar mudanças)
  const prevStatesRef = useRef({
    selectedTicket: null as Ticket | null,
    isDetailsOpen: false,
    isNewTicketOpen: false,
  });

  // Função auxiliar para atualizar o histórico com estado base
  const pushBaseState = useCallback(() => {
    window.history.pushState({ ticketsBase: true }, "");
  }, []);

  // Função auxiliar para atualizar o histórico com camadas específicas
  const pushLayerState = useCallback((layer: string) => {
    window.history.pushState({ ticketsLayer: layer }, "");
  }, []);

  // Efeito para gerenciar o botão de voltar no mobile
  useEffect(() => {
    if (!isMobile) return;

    // Inicializa o estado base se necessário
    if (!window.history.state || window.history.state?.ticketsBase !== true) {
      window.history.replaceState({ ticketsBase: true }, "");
    }

    const handlePopState = () => {
      const state = window.history.state;

      // Ignora estados relacionados ao visualizador de anexos
      if (state?.attachmentViewer || state?.attachmentViewerBase) {
        return;
      }

      // Fecha modal de novo ticket se aberto
      if (isNewTicketOpen) {
        setIsNewTicketOpen(false);
        pushBaseState();
        return;
      }

      // Fecha detalhes se aberto
      if (isDetailsOpen) {
        setIsDetailsOpen(false);
        pushBaseState();
        return;
      }

      // Desseleciona ticket se selecionado
      if (selectedTicket) {
        setSelectedTicket(null);
        pushBaseState();
        return;
      }

      // Previne sair da página /tickets no mobile
      pushBaseState();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isMobile, isNewTicketOpen, isDetailsOpen, selectedTicket, pushBaseState]);

  // Efeito para atualizar o histórico quando estados mudam
  useEffect(() => {
    if (!isMobile) return;

    const prev = prevStatesRef.current;

    // Abre modal de novo ticket
    if (!prev.isNewTicketOpen && isNewTicketOpen) {
      pushLayerState("new-ticket");
    }

    // Abre detalhes
    if (!prev.isDetailsOpen && isDetailsOpen) {
      pushLayerState("details");
    }

    // Seleciona ticket
    if (!prev.selectedTicket && selectedTicket) {
      pushLayerState("chat");
    }

    // Atualiza refs com estados atuais
    prevStatesRef.current = {
      selectedTicket,
      isDetailsOpen,
      isNewTicketOpen,
    };
  }, [isMobile, isNewTicketOpen, isDetailsOpen, selectedTicket, pushLayerState]);

  // Função para voltar (desseleciona ticket)
  const handleBack = useCallback(() => {
    setSelectedTicket(null);
  }, []);

  return {
    selectedTicket,
    isDetailsOpen,
    isNewTicketOpen,
    setSelectedTicket,
    setIsDetailsOpen,
    setIsNewTicketOpen,
    handleBack,
  };
}