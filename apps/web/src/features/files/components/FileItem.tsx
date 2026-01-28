import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
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
  icon: LucideIcon; // ✅ tipagem correta p/ lucide (evita incompatibilidades)
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

function getFileStyle(
  fileName: string,
  fileType: FileItemProps["fileType"]
): FileStyle {
  if (fileType === "pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    return {
      bgColor: "bg-red-100 dark:bg-red-950/30",
      iconColor: "text-red-600 dark:text-red-400",
      icon: FileText,
      label: "PDF",
    };
  }

  if (fileType === "image" || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
    return {
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: ImageIcon,
      label: "Imagem",
    };
  }

  if (fileType === "document" && /\.(doc|docx)$/i.test(fileName)) {
    return {
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: FileText,
      label: "Documento",
    };
  }

  return {
    bgColor: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    icon: FileText,
    label: "Documento",
  };
}

function isImageFile(fileName: string, fileType: FileItemProps["fileType"]) {
  return fileType === "image" || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
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
  withSkeleton = false,
}: FileItemProps) {
  // ✅ evita recomputar em cada render
  const fileStyle = useMemo(() => getFileStyle(fileName, fileType), [fileName, fileType]);
  const { bgColor, iconColor, icon: Icon, label } = fileStyle;

  const isImage = useMemo(() => isImageFile(fileName, fileType), [fileName, fileType]);
  const previewSrc = isImage ? previewUrl || fileUrl : undefined;

  const displayName = useMemo(() => truncateMiddle(fileName), [fileName]);

  // ✅ estado inicial igual ao original, mas agora reage se previewSrc/withSkeleton mudarem
  const [isLoaded, setIsLoaded] = useState(!withSkeleton || !previewSrc);

  useEffect(() => {
    // Se mudou para um novo preview, volta a mostrar skeleton até carregar
    setIsLoaded(!withSkeleton || !previewSrc);
  }, [withSkeleton, previewSrc]);

  const borderStyle = "border border-border";

  // ✅ callbacks estáveis (evita inline handler e melhora previsibilidade)
  const handleContainerClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick?.(); // mantém comportamento original (sem inventar nova prop)
    },
    [onClick]
  );

  const handleImgLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0",
            bgColor
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={fileName}>
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {fileSize && <p className="text-xs text-muted-foreground">{fileSize}</p>}
        </div>

        {showDownload && (
          <button
            type="button" // ✅ evita submit acidental em forms
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            onClick={handleDownloadClick}
            aria-label={`Baixar ${fileName}`} // ✅ a11y mínima
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  if (variant === "tile") {
    return (
      <div
        className={cn("flex flex-col items-center text-center gap-2", onClick && "cursor-pointer")}
        onClick={onClick ? handleContainerClick : undefined} // ✅ não cria handler se não precisa
      >
        {previewSrc ? (
          <div className="relative w-full aspect-square overflow-hidden rounded-md border border-border bg-muted">
            {withSkeleton && !isLoaded && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" aria-hidden="true" />
            )}
            <img
              src={previewSrc}
              alt={fileName}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                withSkeleton && !isLoaded && "opacity-0"
              )}
              onLoad={handleImgLoaded}
              onError={handleImgLoaded}
              loading="lazy" // ✅ não muda visual; melhora performance em grids
              draggable={false} // ✅ evita drag acidental em UI de anexos
            />
          </div>
        ) : (
          <div
            className={cn(
              "w-full aspect-square rounded-md flex items-center justify-center bg-muted/40",
              borderStyle,
              bgColor
            )}
          >
            <Icon className={cn("h-6 w-6", iconColor)} aria-hidden="true" />
          </div>
        )}

        <div className="w-full space-y-1">
          <p className="text-xs font-medium truncate" title={fileName}>
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {fileSize && <p className="text-xs text-muted-foreground">{fileSize}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3 group", onClick && "cursor-pointer")} onClick={onClick ? handleContainerClick : undefined}>
      <div
        className={cn(
          "h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0",
          bgColor
        )}
      >
        <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate group-hover:text-blue-600 cursor-pointer"
          title={fileName}
        >
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {fileSize && <p className="text-xs text-muted-foreground">{fileSize}</p>}
      </div>
    </div>
  );
}
