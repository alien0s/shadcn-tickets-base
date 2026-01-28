// AttachmentViewer.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "framer-motion";

export type AttachmentViewerItem = {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  attachments?: AttachmentViewerItem[]; // ✅ optional para não quebrar
};

export function AttachmentViewer({
  open,
  onOpenChange,
  initialIndex = 0,
  attachments: attachmentsProp = [], // ✅ default seguro
}: Props) {
  // ✅ memo para estabilidade (evita recriar array em cascata)
  const attachments = useMemo(() => attachmentsProp, [attachmentsProp]);

  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const loadedIdsRef = useRef<Set<string>>(new Set());

  const hasPushedStateRef = useRef(false);
  const baseStateRef = useRef<History["state"] | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);

  // ✅ clamp sempre que lista mudar (evita index inválido)
  useEffect(() => {
    if (attachments.length === 0) {
      setCurrentIndex(0);
      setLoadingId(null);
      return;
    }

    setCurrentIndex((prev) => {
      const clamped = Math.min(Math.max(prev, 0), attachments.length - 1);
      return clamped;
    });
  }, [attachments]);

  const currentAttachment =
    attachments.length > 0 ? attachments[currentIndex] : null;

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  const dragControls = useDragControls();

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

  // ✅ Sync do index quando abre OU quando a lista muda
  useEffect(() => {
    if (!open || !api) return;
    if (attachments.length === 0) return;

    const safeIndex = Math.min(
      Math.max(initialIndex, 0),
      attachments.length - 1
    );

    api.scrollTo(safeIndex, true);
    setCurrentIndex(safeIndex);

    const initial = attachments[safeIndex];
    if (initial?.type === "image") {
      setLoadingId(loadedIdsRef.current.has(initial.id) ? null : initial.id);
    } else {
      setLoadingId(null);
    }
  }, [open, api, initialIndex, attachments]);

  useEffect(() => {
    if (!api) return;

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
      api.off("select", onSelect); // ✅ cleanup void
    };
  }, [api, attachments]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (open) {
      if (!hasPushedStateRef.current) {
        const currentState = window.history.state ?? {};
        baseStateRef.current = currentState;

        window.history.replaceState(
          { ...currentState, attachmentViewerBase: true },
          ""
        );
        window.history.pushState(
          { ...currentState, attachmentViewer: true },
          ""
        );
        hasPushedStateRef.current = true;
      }
    } else {
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
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") requestClose();
  };

  const handleDragEnd = (
    _e: unknown,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    if (info.offset.y > 100 || (info.velocity.y > 500 && info.offset.y > 0)) {
      requestClose();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
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
              if (viewerRef.current?.contains(target)) return;
              requestClose();
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
              dragElastic={{ top: 0, bottom: 0.7 }}
              dragDirectionLock
              dragListener={false}
              dragControls={dragControls}
              onDragEnd={handleDragEnd}
              onPointerDown={(e) => {
                if (typeof window === "undefined") return;
                if (e.clientY < window.innerHeight * 0.2) dragControls.start(e);
              }}
              style={{ y }}
              className="relative z-10 w-full h-full flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/50 border-none mt-[env(safe-area-inset-top)] mr-[env(safe-area-inset-right)] focus:ring-0 focus:outline-none focus:bg-black/50 focus-visible:outline-none focus-visible:ring-0 text-white hover:bg-black/70 hover:text-white"
                onClick={requestClose}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>

              {/* ✅ Estado vazio seguro (evita crash) */}
              {attachments.length === 0 ? (
                <div className="text-white/80 text-sm">
                  Carregando anexos...
                </div>
              ) : (
                <>
                  <Carousel
                    setApi={setApi}
                    className="w-full h-full [&_.overflow-hidden]:h-full"
                    opts={{ loop: true }}
                  >
                    <CarouselContent className="h-full -ml-0">
                      {attachments.map((attachment) => {
                        const isThisLoading = loadingId === attachment.id;

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
                                      <div className="text-white text-sm">
                                        Carregando...
                                      </div>
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
                                      loadedIdsRef.current.add(attachment.id);
                                      setLoadingId((current) =>
                                        current === attachment.id ? null : current
                                      );
                                    }}
                                    onError={() => {
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
                                  <p className="text-white/70 text-sm">
                                    {attachment.name}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    className="mt-4"
                                  >
                                    Baixar arquivo
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>

                    <CarouselPrevious className="hidden md:flex left-4 h-12 w-12 rounded-full bg-black/50 border-none text-white hover:bg-black/70 hover:text-white" />
                    <CarouselNext className="hidden md:flex right-4 h-12 w-12 rounded-full bg-black/50 border-none text-white hover:bg-black/70 hover:text-white" />
                  </Carousel>

                  {/* Overlay inferior com info do slide atual */}
                  {currentAttachment && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 pointer-events-none">
                      <p className="text-white text-sm font-medium text-center">
                        {currentAttachment.name}
                      </p>
                      <p className="text-white/60 text-xs mt-1 text-center">
                        {currentIndex + 1} de {attachments.length}
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
