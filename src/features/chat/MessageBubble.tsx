import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FileItem } from "@/components/FileItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export const MessageBubble = React.memo(function MessageBubble(props: MessageBubbleProps) {
    const { isOwn, timestamp } = props;
    // Guard animation class so it does not re-apply on every parent render.
    const animationClass = useMemo(() => "animate-in fade-in slide-in-from-bottom-2 duration-200", []);
    const avatarUrl = isOwn
        ? "https://img.wattpad.com/21bf8fcb4e0790256056b6cc1ad4943569479292/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f7279496d6167652f354b3576414f686f516e4c3368673d3d2d3332383734303530362e313438383033353235653662663366313836333836383732303237302e6a7067?s=fit&w=720&h=720"
        : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s";
    const avatarFallback = isOwn ? "EU" : "OP";

    const containerClass = cn(
        "flex items-start gap-2",
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
                {!isOwn && (
                    <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                        <AvatarFallback className="rounded-lg text-xs">{avatarFallback}</AvatarFallback>
                    </Avatar>
                )}
                <div className={cn(bubbleBaseClass, "px-3 py-2", animationClass)}>
                    <p>{props.content}</p>
                    {timestamp && (
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                            {timestamp}
                        </span>
                    )}
                </div>
                {isOwn && (
                    <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                        <AvatarFallback className="rounded-lg text-xs">{avatarFallback}</AvatarFallback>
                    </Avatar>
                )}
            </div>
        );
    }

    if (props.type === "file") {
        return (
            <div className={containerClass}>
                {!isOwn && (
                    <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                        <AvatarFallback className="rounded-lg text-xs">{avatarFallback}</AvatarFallback>
                    </Avatar>
                )}
                <div className={cn(bubbleBaseClass, "p-3", animationClass)}>
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
                {isOwn && (
                    <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                        <AvatarFallback className="rounded-lg text-xs">{avatarFallback}</AvatarFallback>
                    </Avatar>
                )}
            </div>
        );
    }

    if (props.type === "image") {
        return (
            <div className={containerClass}>
                {!isOwn && (
                    <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                        <AvatarFallback className="rounded-lg text-xs">{avatarFallback}</AvatarFallback>
                    </Avatar>
                )}
                <div className={cn(bubbleBaseClass, "p-2 overflow-hidden", animationClass)}>
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
                {isOwn && (
                    <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                        <AvatarFallback className="rounded-lg text-xs">{avatarFallback}</AvatarFallback>
                    </Avatar>
                )}
            </div>
        );
    }

    return null;
});
