import { useState, useEffect, useRef } from "react";
import {
  Dialog,
} from "@/components/ui/dialog";
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
import { motion, useMotionValue, useTransform, useDragControls } from "framer-motion";

// Tipos de anexos
type Attachment = {
  id: string;
  url: string;
  type: "image" | "file";
  name: string;
  sharedBy?: string;
  sharedDate?: string;
};

// Mock de anexos usando Picsum Photos (API falsa de imagens)
const MOCK_ATTACHMENTS: Attachment[] = [
  {
    id: "1",
    url: "https://www.minhatatuagem.com/wp-content/uploads/2022/07/fotos-tumblr-9.jpg",
    type: "image",
    name: "screenshot-issue.jpg",
    sharedBy: "Agent Lisa",
    sharedDate: "May 25th",
  },
  {
    id: "2",
    url: "https://cdn.britannica.com/59/256159-050-32D4A1F1/Tumblr-site-on-smartphone.jpg",
    type: "image",
    name: "error-details.jpg",
    sharedBy: "You",
    sharedDate: "May 24th",
  },
  {
    id: "3",
    url: "https://picsum.photos/seed/3/1200/800",
    type: "image",
    name: "bug-screenshot.png",
    sharedBy: "Agent Lisa",
    sharedDate: "May 23rd",
  },
  {
    id: "4",
    url: "https://store-images.s-microsoft.com/image/apps.19691.14420356529270456.a0e62d2f-10e7-480b-b5a1-cb70a39b4d1b.3af40891-43ad-4549-9351-96f5c86cae65",
    type: "image",
    name: "console-log.jpg",
    sharedBy: "You",
    sharedDate: "May 22nd",
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
};

export function AttachmentViewer({ open, onOpenChange, initialIndex = 0 }: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasPushedStateRef = useRef(false);
  const baseStateRef = useRef<History["state"] | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const attachments = MOCK_ATTACHMENTS;
  const currentAttachment = attachments[currentIndex];

  // Sync initial index when opening or api ready
  useEffect(() => {
    if (open && api) {
      api.scrollTo(initialIndex, true); // true = instant jump
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex, api]);

  // Track carousel slide changes
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
      setIsLoading(false); // Reset loading on slide change if needed
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
    updateIsMobile();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateIsMobile);
    } else {
      mediaQuery.addListener(updateIsMobile);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateIsMobile);
      } else {
        mediaQuery.removeListener(updateIsMobile);
      }
    };
  }, []);

  const requestClose = () => {
    if (typeof window === "undefined") {
      onOpenChange(false);
      return;
    }

    if (hasPushedStateRef.current && window.history.state?.attachmentViewer) {
      window.history.back();
      return;
    }

    onOpenChange(false);
  };

  // URL state management logic (kept from original)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (open) {
      const currentState = window.history.state ?? {};
      baseStateRef.current = currentState;
      window.history.replaceState(
        { ...currentState, attachmentViewerBase: true },
        ""
      );
      window.history.pushState({ ...currentState, attachmentViewer: true }, "");
      hasPushedStateRef.current = true;
    } else if (hasPushedStateRef.current && window.history.state?.attachmentViewer) {
      window.history.back();
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


  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  // Keyboard support is handled by Carousel naturally, but we keep Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      requestClose();
    }
  };

  // Framer Motion values
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]); // Only fade when dragging down
  const dragControls = useDragControls();

  const handleDragEnd = (_: any, info: any) => {
    // Only close if dragging DOWN (positive Y) and past threshold
    if (info.offset.y > 100 || (info.velocity.y > 500 && info.offset.y > 0)) {
      onOpenChange(false);
    }
    // Otherwise snaps back
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Transparent overlay to allow motion.div to handle background */}
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
              if (contentRef.current?.contains(target)) return;
              requestClose();
            }}
            onTouchEnd={(event) => {
              const target = event.target as Node;
              if (contentRef.current?.contains(target)) return;
              requestClose();
            }}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }} // Allow drag down, block up
              dragDirectionLock
              dragListener={false} // Manual start only
              dragControls={dragControls}
              onDragEnd={handleDragEnd}
              onPointerDown={(e) => {
                // Only initiate drag if touching top 20% of screen
                if (e.clientY < window.innerHeight * 0.20) {
                  dragControls.start(e);
                }
              }}
              style={{ y }}
              className="relative z-10 w-full h-full flex items-center justify-center select-none"
              ref={contentRef}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onTouchEnd={(event) => {
                event.stopPropagation();
              }}
            >

              {/* Botão Fechar */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/50 border-none mt-[env(safe-area-inset-top)] mr-[env(safe-area-inset-right)] focus:ring-0 focus:outline-none focus:bg-black/50 focus-visible:outline-none focus-visible:ring-0 text-white hover:bg-black/70 hover:text-white"
                onClick={requestClose}
              >
                <X className="h-5 w-5" />
              </Button>

              <Carousel
                setApi={setApi}
                className="w-full h-full [&_.overflow-hidden]:h-full"
                opts={{
                  loop: true, // Enable infinite loop
                }}
              >
                <CarouselContent className="h-full -ml-0">
                  {attachments.map((attachment) => (
                    <CarouselItem key={attachment.id} className="h-full pl-0 flex items-center justify-center relative">
                      {/* Área de conteúdo */}
                      <div className="w-full h-full flex flex-col items-center justify-center p-0 md:p-4">
                        {attachment.type === "image" ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            {isLoading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-sm">Carregando...</div>
                              </div>
                            )}
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className={cn(
                                "max-w-full max-h-[85vh] object-contain shadow-2xl transition-opacity duration-300",
                                isLoading ? "opacity-0" : "opacity-100"
                              )}
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md text-center border border-white/20">
                            <p className="text-white text-lg mb-2">Visualização de arquivo</p>
                            <p className="text-white/70 text-sm">{attachment.name}</p>
                            <Button variant="secondary" className="mt-4">Baixar arquivo</Button>
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious className="hidden md:flex left-4 h-12 w-12 rounded-full bg-black/50 border-none text-white hover:bg-black/70 hover:text-white" />
                <CarouselNext className="hidden md:flex right-4 h-12 w-12 rounded-full bg-black/50 border-none text-white hover:bg-black/70 hover:text-white" />
              </Carousel>

              {/* Informações do anexo (Overlay fixo na inferior) */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 pointer-events-none">
                {currentAttachment && (
                  <>
                    <p className="text-white text-sm font-medium text-center">{currentAttachment.name}</p>
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
    </Dialog>
  );
}
