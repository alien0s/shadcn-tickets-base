import { FileText, Image as ImageIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type FileItemProps = {
    fileName: string;
    fileSize?: string;
    fileType?: "pdf" | "image" | "document";
    sharedBy?: string;
    sharedDate?: string;
    onClick?: () => void;
    showDownload?: boolean;
    variant?: "default" | "compact";
};

export function FileItem({
    fileName,
    fileSize,
    fileType = "document",
    sharedBy,
    sharedDate,
    onClick,
    showDownload = false,
    variant = "default"
}: FileItemProps) {
    // Determinar cor e ícone baseado no tipo de arquivo
    const getFileStyle = () => {
        if (fileType === "pdf" || fileName.endsWith(".pdf")) {
            return {
                bgColor: "bg-red-100 dark:bg-red-950/30",
                iconColor: "text-red-600 dark:text-red-400",
                icon: FileText
            };
        }
        if (fileType === "image" || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
            return {
                bgColor: "bg-blue-100 dark:bg-blue-950/30",
                iconColor: "text-blue-600 dark:text-blue-400",
                icon: ImageIcon
            };
        }
        return {
            bgColor: "bg-gray-100 dark:bg-gray-800",
            iconColor: "text-gray-600 dark:text-gray-400",
            icon: FileText
        };
    };

    const { bgColor, iconColor, icon: Icon } = getFileStyle();

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0", bgColor)}>
                    <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
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
                <p className="text-sm font-medium truncate group-hover:text-blue-600 cursor-pointer">
                    {fileName}
                </p>
                {(sharedBy || sharedDate) && (
                    <p className="text-xs text-muted-foreground">
                        {sharedBy && `Shared by ${sharedBy}`}
                        {sharedBy && sharedDate && " on "}
                        {sharedDate}
                    </p>
                )}
                {fileSize && !sharedBy && !sharedDate && (
                    <p className="text-xs text-muted-foreground">{fileSize}</p>
                )}
            </div>
        </div>
    );
}
