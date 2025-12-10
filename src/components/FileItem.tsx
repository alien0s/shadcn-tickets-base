import { useState } from "react";
import { FileText, Image as ImageIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type FileItemProps = {
    fileName: string;
    fileSize?: string;
    fileType?: "pdf" | "image" | "document";
    fileUrl?: string;
    previewUrl?: string;
    onClick?: () => void;
    showDownload?: boolean;
    variant?: "default" | "compact" | "tile";
    withSkeleton?: boolean;
};

type FileStyle = {
    bgColor: string;
    iconColor: string;
    icon: typeof FileText;
    label: string;
};

function truncateMiddle(text: string, maxLength = 28) {
    if (text.length <= maxLength) return text;
    const ellipsis = "...";
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return `${text.slice(0, frontChars)}${ellipsis}${text.slice(-backChars)}`;
}

function getFileStyle(fileName: string, fileType: FileItemProps["fileType"]): FileStyle {
    if (fileType === "pdf" || fileName.toLowerCase().endsWith(".pdf")) {
        return {
            bgColor: "bg-red-100 dark:bg-red-950/30",
            iconColor: "text-red-600 dark:text-red-400",
            icon: FileText,
            label: "PDF"
        };
    }

    if (fileType === "image" || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
        return {
            bgColor: "bg-blue-100 dark:bg-blue-950/30",
            iconColor: "text-blue-600 dark:text-blue-400",
            icon: ImageIcon,
            label: "Imagem"
        };
    }

    if (fileType === "document" && /\.(doc|docx)$/i.test(fileName)) {
        return {
            bgColor: "bg-blue-100 dark:bg-blue-950/30",
            iconColor: "text-blue-600 dark:text-blue-400",
            icon: FileText,
            label: "Documento"
        };
    }

    return {
        bgColor: "bg-gray-100 dark:bg-gray-800",
        iconColor: "text-gray-600 dark:text-gray-400",
        icon: FileText,
        label: "Documento"
    };
}

export function FileItem({
    fileName,
    fileSize,
    fileType = "document",
    fileUrl,
    previewUrl,
    onClick,
    showDownload = false,
    variant = "default",
    withSkeleton = false
}: FileItemProps) {
    const { bgColor, iconColor, icon: Icon, label } = getFileStyle(fileName, fileType);
    const isImage = fileType === "image" || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const previewSrc = isImage ? (previewUrl || fileUrl) : undefined;
    const displayName = truncateMiddle(fileName);
    const [isLoaded, setIsLoaded] = useState(!withSkeleton || !previewSrc);
    const borderStyle = "border border-border";

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0", bgColor)}>
                    <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={fileName}>{displayName}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {fileSize && <p className="text-xs text-muted-foreground">{fileSize}</p>}
                </div>
                {showDownload && (
                    <button
                        className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}
                    >
                        <Download className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }

    if (variant === "tile") {
        return (
            <div
                className={cn(
                    "flex flex-col items-center text-center gap-2",
                    onClick && "cursor-pointer"
                )}
                onClick={onClick}
            >
                {previewSrc ? (
                    <div className="relative w-full aspect-square overflow-hidden rounded-md border border-border bg-muted">
                        {withSkeleton && !isLoaded && (
                            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
                        )}
                        <img
                            src={previewSrc}
                            alt={fileName}
                            className={cn(
                                "w-full h-full object-cover transition-opacity duration-300",
                                withSkeleton && !isLoaded && "opacity-0"
                            )}
                            onLoad={() => setIsLoaded(true)}
                            onError={() => setIsLoaded(true)}
                        />
                    </div>
                ) : (
                    <div className={cn(
                        "w-full aspect-square rounded-md flex items-center justify-center bg-muted/40",
                        borderStyle,
                        bgColor
                    )}>
                        <Icon className={cn("h-6 w-6", iconColor)} />
                    </div>
                )}
                <div className="w-full space-y-1">
                    <p className="text-xs font-medium truncate" title={fileName}>{displayName}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {fileSize && <p className="text-xs text-muted-foreground">{fileSize}</p>}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-start gap-3 group",
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            <div className={cn("h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0", bgColor)}>
                <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-blue-600 cursor-pointer" title={fileName}>
                    {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
                {fileSize && <p className="text-xs text-muted-foreground">{fileSize}</p>}
            </div>
        </div>
    );
}
