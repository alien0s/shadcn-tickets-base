// AttachmentViewer.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useDragControls, useMotionValue, useTransform } from "framer-motion";
import { mockAttachmentViewerItems } from "../data/mockAttachments";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
};

export function AttachmentViewer({ open, onOpenChange, initialIndex = 0 }: Props) {
  const attachments = mockAttachmentViewerItems; // TODO: depois vira props/API

  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  /**
   * ✅ Loading por slide (não global).
   * Se fosse boolean global, TODAS as imagens do carousel ficariam "Carregando..." ao trocar slide.
   */
  const [loadingId, setLoadingId] = useState<string | null>(null);

  /**
   * Cache de imagens que já carregaram uma vez.
   * Evita mostrar "Carregando..." de novo quando o usuário volta para uma imagem já vista.
   */
  const loadedIdsRef = useRef<Set<string>>(new Set());

  // refs para controle do histórico (back button)
  const hasPushedStateRef = useRef(false);
  const baseStateRef = useRef<History["state"] | null>(null);

  // ref do conteúdo interno: clique fora fecha, clique dentro não fecha
  const viewerRef = useRef<HTMLDivElement>(null);

  const currentAttachment = attachments[currentIndex];

  // Framer Motion values (drag para fechar)
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]); // fade ao arrastar pra baixo
  const dragControls = useDragControls();

  /**
   * Fecha respeitando o histórico:
   * - se empilhou estado do viewer, volta no history (para desfazer o pushState)
   * - senão, só fecha o dialog
   */
  const requestClose = useCallback(() => {
    if (typeof window === "undefined") {
      onOpenChange(false);
      return;
    }

    if (hasPushedStateRef.current && window.history.state?.attachmentViewer) {
      window.history.back();
      return;
    }

    onOpenChange(false);
  }, [onOpenChange]);

  /**
   * Sync do initialIndex quando:
   * - o modal abre
   * - o Carousel API está pronto
   */
  useEffect(() => {
    if (!open || !api) return;

    api.scrollTo(initialIndex, true); // jump instantâneo
    setCurrentIndex(initialIndex);

    const initial = attachments[initialIndex];
    if (initial?.type === "image") {
      // Só mostra loading se essa imagem ainda não carregou antes
      setLoadingId(loadedIdsRef.current.has(initial.id) ? null : initial.id);
    } else {
      setLoadingId(null);
    }
  }, [open, api, initialIndex, attachments]);

  /**
   * Track mudanças do carousel:
   * - atualiza currentIndex
   * - ativa loading apenas para o slide atual (se for image e ainda não carregou)
   */
  useEffect(() => {
    if (!api) return undefined; // ✅ importante para o TS (EffectCallback)

    const onSelect = () => {
      const nextIndex = api.selectedScrollSnap();
      setCurrentIndex(nextIndex);

      const next = attachments[nextIndex];
      if (next?.type === "image") {
        setLoadingId(loadedIdsRef.current.has(next.id) ? null : next.id);
      } else {
        setLoadingId(null);
      }
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, attachments]);

  /**
   * Gerenciamento de histórico (back button):
   * - Ao abrir: cria um "marcador" no history para permitir fechar com back
   * - Ao voltar: fecha o modal e restaura o state base
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (open) {
      // Evita empilhar estados repetidos em re-renders
      if (!hasPushedStateRef.current) {
        const currentState = window.history.state ?? {};
        baseStateRef.current = currentState;

        window.history.replaceState({ ...currentState, attachmentViewerBase: true }, "");
        window.history.pushState({ ...currentState, attachmentViewer: true }, "");
        hasPushedStateRef.current = true;
      }
    } else {
      // Reset local quando fecha normalmente
      hasPushedStateRef.current = false;
    }

    const handlePopState = () => {
      if (!open) return;

      onOpenChange(false);

      const baseState = baseStateRef.current ?? {};
      window.history.replaceState(baseState, "");
      hasPushedStateRef.current = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onOpenChange]);

  // Esc fecha
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") requestClose();
  };

  // Drag down para fechar
  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    // Fecha apenas se arrastou para baixo o suficiente
    if (info.offset.y > 100 || (info.velocity.y > 500 && info.offset.y > 0)) {
      requestClose(); // ✅ usa a mesma regra do histórico
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay transparente: quem dá o fundo escuro é o motion.div */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-transparent" />

        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 w-full h-[var(--app-height)] p-0 border-none focus:outline-none overflow-hidden bg-transparent shadow-none"
          )}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            className="relative w-full h-full flex items-center justify-center bg-black/60"
            style={{ opacity }}
            onClick={(event) => {
              const target = event.target as Node;
              if (viewerRef.current?.contains(target)) return; // clique dentro não fecha
              requestClose(); // clique fora fecha
            }}
            onTouchEnd={(event) => {
              const target = event.target as Node;
              if (viewerRef.current?.contains(target)) return;
              requestClose();
            }}
          >
            <motion.div
              ref={viewerRef}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }} // permite arrastar pra baixo (fecha), bloqueia pra cima
              dragDirectionLock
              dragListener={false} // drag inicia manualmente
              dragControls={dragControls}
              onDragEnd={handleDragEnd}
              onPointerDown={(e) => {
                // Inicia drag só tocando no topo 20% (evita conflito com navegação no meio da tela)
                if (typeof window === "undefined") return;
                if (e.clientY < window.innerHeight * 0.2) dragControls.start(e);
              }}
              style={{ y }}
              className="relative z-10 w-full h-full flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Botão Fechar */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/50 border-none mt-[env(safe-area-inset-top)] mr-[env(safe-area-inset-right)] focus:ring-0 focus:outline-none focus:bg-black/50 focus-visible:outline-none focus-visible:ring-0 text-white hover:bg-black/70 hover:text-white"
                onClick={requestClose}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </Button>

              <Carousel
                setApi={setApi}
                className="w-full h-full [&_.overflow-hidden]:h-full"
                opts={{ loop: true }}
              >
                <CarouselContent className="h-full -ml-0">
                  {attachments.map((attachment) => {
                    const isThisLoading = loadingId === attachment.id; // ✅ loading só do slide atual

                    return (
                      <CarouselItem
                        key={attachment.id}
                        className="h-full pl-0 flex items-center justify-center relative"
                      >
                        <div className="w-full h-full flex flex-col items-center justify-center p-0 md:p-4">
                          {attachment.type === "image" ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {isThisLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-white text-sm">Carregando...</div>
                                </div>
                              )}

                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                draggable={false}
                                className={cn(
                                  "max-w-full max-h-[85vh] object-contain shadow-2xl transition-opacity duration-300",
                                  isThisLoading ? "opacity-0" : "opacity-100"
                                )}
                                onLoad={() => {
                                  // Marca como carregada e desliga loading só se for o slide atual
                                  loadedIdsRef.current.add(attachment.id);
                                  setLoadingId((current) =>
                                    current === attachment.id ? null : current
                                  );
                                }}
                                onError={() => {
                                  // Desliga loading mesmo em erro
                                  setLoadingId((current) =>
                                    current === attachment.id ? null : current
                                  );
                                }}
                              />
                            </div>
                          ) : (
                            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md text-center border border-white/20">
                              <p className="text-white text-lg mb-2">
                                Visualização de arquivo
                              </p>
                              <p className="text-white/70 text-sm">{attachment.name}</p>

                              {/* TODO: ligar com API real (downloadUrl) */}
                              <Button type="button" variant="secondary" className="mt-4">
                                Baixar arquivo
                              </Button>
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>

                {/* Navegação (desktop) */}
                <CarouselPrevious className="hidden md:flex left-4 h-12 w-12 rounded-full bg-black/50 border-none text-white hover:bg-black/70 hover:text-white" />
                <CarouselNext className="hidden md:flex right-4 h-12 w-12 rounded-full bg-black/50 border-none text-white hover:bg-black/70 hover:text-white" />
              </Carousel>

              {/* Overlay inferior com info do slide atual */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 pointer-events-none">
                {currentAttachment && (
                  <>
                    <p className="text-white text-sm font-medium text-center">
                      {currentAttachment.name}
                    </p>
                    <p className="text-white/60 text-xs mt-1 text-center">
                      {currentIndex + 1} de {attachments.length}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
