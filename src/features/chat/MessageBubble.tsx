import { cn } from "@/lib/utils";
import { FileItem } from "@/components/FileItem";

type BaseMessageProps = {
    isOwn: boolean;
    timestamp?: string;
};

type TextMessageProps = BaseMessageProps & {
    type: "text";
    content: string;
};

type FileMessageProps = BaseMessageProps & {
    type: "file";
    fileName: string;
    fileSize: string;
    fileUrl?: string;
};

type ImageMessageProps = BaseMessageProps & {
    type: "image";
    imageUrl: string;
    alt?: string;
    onImageClick?: () => void;
};

type MessageBubbleProps = TextMessageProps | FileMessageProps | ImageMessageProps;

export function MessageBubble(props: MessageBubbleProps) {
    const { isOwn, timestamp } = props;

    const containerClass = cn(
        "flex",
        isOwn ? "justify-end" : "justify-start"
    );

    const bubbleBaseClass = cn(
        "max-w-[70%] rounded-lg text-sm",
        isOwn
            ? "bg-blue-100 dark:bg-blue-950/50 text-foreground"
            : "bg-muted text-foreground"
    );

    if (props.type === "text") {
        return (
            <div className={containerClass}>
                <div className={cn(bubbleBaseClass, "px-3 py-2")}>
                    <p>{props.content}</p>
                    {timestamp && (
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                            {timestamp}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    if (props.type === "file") {
        return (
            <div className={containerClass}>
                <div className={cn(bubbleBaseClass, "p-3")}>
                    <FileItem
                        fileName={props.fileName}
                        fileSize={props.fileSize}
                        variant="compact"
                        showDownload={true}
                        onClick={() => {
                            if (props.fileUrl) {
                                window.open(props.fileUrl, "_blank");
                            }
                        }}
                    />
                    {timestamp && (
                        <span className="text-[10px] text-muted-foreground mt-2 block">
                            {timestamp}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    if (props.type === "image") {
        return (
            <div className={containerClass}>
                <div className={cn(bubbleBaseClass, "p-2 overflow-hidden")}>
                    <div className="relative w-48 h-48 rounded-md overflow-hidden bg-muted">
                        <img
                            src={props.imageUrl}
                            alt={props.alt || "Image"}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                                if (props.onImageClick) {
                                    props.onImageClick();
                                } else {
                                    window.open(props.imageUrl, "_blank");
                                }
                            }}
                        />
                    </div>
                    {timestamp && (
                        <span className="text-[10px] text-muted-foreground mt-2 block">
                            {timestamp}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
