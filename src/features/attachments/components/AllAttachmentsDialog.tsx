import { useMemo, useState, useCallback } from "react"; // useMemo para evitar recomputar filters; useCallback pra handlers estáveis
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileItem } from "@/features/files/components/FileItem";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttachmentItem } from "../types/attachmentTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: AttachmentItem[];
  onAttachmentClick?: (index: number) => void; // index do array original (mantido para compatibilidade)
  isLoading?: boolean;
};

/**
 * Gera uma chave estável para React `key` e para localizar o anexo no array original.
 * - Ideal: usar um `id` real vindo da API
 * - Fallback: combina campos que tendem a diferenciar itens (nome + previewUrl)
 */
function getAttachmentKey(file: AttachmentItem) {
  // Se existir `id` no tipo real (muito comum quando chegar API), usamos ele
  if ("id" in file && file.id) return String(file.id);

  // Fallback: previewUrl geralmente muda entre arquivos diferentes, mesmo com mesmo nome
  const preview = file.previewUrl ?? "";
  return `${file.fileName}::${preview}`;
}

export function AllAttachmentsDialog({
  open,
  onOpenChange,
  attachments,
  onAttachmentClick,
  isLoading = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<"images" | "documents">("images");

  /**
   * useMemo evita recalcular filters toda vez que o componente renderiza.
   * Isso não é "micro-otimização": deixa o componente previsível quando a lista crescer (API real).
   */
  const { images, documents } = useMemo(() => {
    const imgs: AttachmentItem[] = [];
    const docs: AttachmentItem[] = [];

    for (const file of attachments) {
      if (file.fileType === "image") imgs.push(file);
      else if (file.fileType === "pdf" || file.fileType === "document") docs.push(file);
    }

    return { images: imgs, documents: docs };
  }, [attachments]);

  /**
   * Monta um índice (mapa) para achar rapidamente o índice no array original.
   * Evita `findIndex` (O(n)) a cada clique e evita erro quando há nomes repetidos.
   */
  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    attachments.forEach((file, idx) => {
      map.set(getAttachmentKey(file), idx); // key -> índice real no array original
    });
    return map;
  }, [attachments]);

  const handleAttachmentClick = useCallback(
    (file: AttachmentItem) => {
      if (!onAttachmentClick) return; // evita if repetido abaixo e mantém handler simples

      const key = getAttachmentKey(file); // chave estável do item
      const index = indexByKey.get(key); // índice real no array original

      if (typeof index === "number") {
        onAttachmentClick(index);
      }
    },
    [indexByKey, onAttachmentClick]
  );

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`} // ok usar index em skeleton porque é lista artificial e estável
          className="rounded-md border border-border bg-background p-2"
        >
          <Skeleton className="w-full aspect-square rounded-[6px]" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          flex flex-col h-[var(--app-height)] max-h-[var(--app-height)]
          w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 rounded-none
          overflow-hidden p-4
          min-[500px]:w-[95vw] min-[500px]:max-w-[600px] min-[500px]:left-1/2 min-[500px]:-translate-x-1/2
          sm:top-1/2 sm:-translate-y-1/2 sm:h-[640px] sm:max-h-[640px] sm:w-full sm:max-w-[550px]
          sm:rounded-lg sm:p-6 dark:border-2
        "
      >
        <DialogHeader>
          <DialogTitle>Todos os Anexos</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "images" | "documents")} // tabs retorna string
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="images">Imagens ({images.length})</TabsTrigger>
            <TabsTrigger value="documents">
              Documentos ({documents.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="images" className="h-full overflow-y-auto">
              {isLoading ? (
                renderSkeletonGrid()
              ) : images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((file) => {
                    const key = getAttachmentKey(file); // key estável para React + lookup

                    return (
                      <div
                        key={key} // ❗ evita index na key (melhor para remover/reordenar)
                        className="rounded-md border border-border bg-background hover:border-primary/40 transition-colors p-2 cursor-pointer"
                        onClick={() => handleAttachmentClick(file)} // handler estável
                      >
                        <FileItem
                          fileName={file.fileName}
                          fileType={file.fileType}
                          previewUrl={file.previewUrl}
                          variant="tile"
                          withSkeleton
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  Nenhuma imagem encontrada
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="h-full overflow-y-auto">
              {isLoading ? (
                renderSkeletonGrid()
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {documents.map((file) => {
                    const key = getAttachmentKey(file); // mesma estratégia de key

                    return (
                      <div
                        key={key}
                        className="rounded-md border border-border bg-background hover:border-primary/40 transition-colors p-2 cursor-pointer"
                        onClick={() => handleAttachmentClick(file)}
                      >
                        <FileItem
                          fileName={file.fileName}
                          fileType={file.fileType}
                          previewUrl={file.previewUrl}
                          variant="tile"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  Nenhum documento encontrado
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
