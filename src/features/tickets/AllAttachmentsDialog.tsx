import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileItem } from "@/components/FileItem";
import { Skeleton } from "@/components/ui/skeleton";

type AttachmentItem = {
    fileName: string;
    fileType: "pdf" | "image" | "document";
    previewUrl?: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachments: AttachmentItem[];
    onAttachmentClick?: (index: number) => void;
    isLoading?: boolean;
};

export function AllAttachmentsDialog({
    open,
    onOpenChange,
    attachments,
    onAttachmentClick,
    isLoading = false,
}: Props) {
    const [activeTab, setActiveTab] = useState<"images" | "documents">("images");

    // Separar anexos por tipo
    const images = attachments.filter((file) => file.fileType === "image");
    const documents = attachments.filter((file) => file.fileType === "pdf" || file.fileType === "document");

    const handleAttachmentClick = (file: AttachmentItem) => {
        // Encontrar o índice no array original de attachments
        const index = attachments.findIndex((a) => a.fileName === file.fileName);
        if (index !== -1 && onAttachmentClick) {
            onAttachmentClick(index);
        }
    };

    const renderSkeletonGrid = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={`skeleton-${index}`}
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
            <DialogContent className="flex flex-col h-[var(--app-height)] max-h-[var(--app-height)] w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 rounded-none overflow-hidden p-4 min-[500px]:w-[95vw] min-[500px]:max-w-[600px] min-[500px]:left-1/2 min-[500px]:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:h-[640px] sm:max-h-[640px] sm:w-full sm:max-w-[550px] sm:rounded-lg sm:p-6 dark:border-2">
                <DialogHeader>
                    <DialogTitle>Todos os Anexos</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "images" | "documents")} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="images">
                            Imagens ({images.length})
                        </TabsTrigger>
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
                                    {images.map((file, index) => (
                                        <div
                                            key={`${file.fileName}-${index}`}
                                            className="rounded-md border border-border bg-background hover:border-primary/40 transition-colors p-2 cursor-pointer"
                                            onClick={() => handleAttachmentClick(file)}
                                        >
                                            <FileItem
                                                fileName={file.fileName}
                                                fileType={file.fileType}
                                                previewUrl={file.previewUrl}
                                                variant="tile"
                                                withSkeleton
                                            />
                                        </div>
                                    ))}
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
                                    {documents.map((file, index) => (
                                        <div
                                            key={`${file.fileName}-${index}`}
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
                                    ))}
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
