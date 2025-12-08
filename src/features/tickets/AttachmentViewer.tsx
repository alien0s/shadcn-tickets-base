import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    url: "https://picsum.photos/seed/1/1200/800",
    type: "image",
    name: "screenshot-issue.jpg",
    sharedBy: "Agent Lisa",
    sharedDate: "May 25th",
  },
  {
    id: "2",
    url: "https://picsum.photos/seed/2/1200/800",
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
    url: "https://picsum.photos/seed/4/1200/800",
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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);

  const attachments = MOCK_ATTACHMENTS;
  const currentAttachment = attachments[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < attachments.length - 1;

  // Reset index when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const handlePrevious = () => {
    if (hasPrevious) {
      setIsLoading(true);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setIsLoading(true);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 border-none bg-transparent translate-x-[-50%] translate-y-[-50%] left-[50%] top-[50%] [&>button]:hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Container principal */}
        <div className="relative w-full h-full flex items-center justify-center z-50">
          {/* Botão Fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Botão Previous */}
          {hasPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Botão Next */}
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Área de conteúdo da imagem */}
          <div className="flex flex-col items-center justify-center w-full h-full p-4">
            {currentAttachment && (
              <>
                {currentAttachment.type === "image" ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-sm">Carregando...</div>
                      </div>
                    )}
                    <img
                      src={currentAttachment.url}
                      alt={currentAttachment.name}
                      className={cn(
                        "max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl",
                        isLoading && "opacity-0"
                      )}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  </div>
                ) : (
                  <div className="bg-background rounded-lg p-8 max-w-md text-center">
                    <p className="text-foreground">Visualização de arquivo não disponível</p>
                    <p className="text-muted-foreground text-sm mt-2">{currentAttachment.name}</p>
                  </div>
                )}

                {/* Informações do anexo */}
                <div className="mt-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-white text-sm font-medium">{currentAttachment.name}</p>
                  {currentAttachment.sharedBy && currentAttachment.sharedDate && (
                    <p className="text-white/70 text-xs mt-1">
                      Compartilhado por {currentAttachment.sharedBy} em {currentAttachment.sharedDate}
                    </p>
                  )}
                  <p className="text-white/60 text-xs mt-1">
                    {currentIndex + 1} de {attachments.length}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

