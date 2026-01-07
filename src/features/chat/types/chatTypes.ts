export type ChatMessage =
  | {
      id: string;
      type: "text";
      isOwn: boolean;
      content: string;
      timestamp: string;
    }
  | {
      id: string;
      type: "file";
      isOwn: boolean;
      fileName: string;
      fileSize: string;
      fileUrl: string;
      timestamp: string;
    }
  | {
      id: string;
      type: "image";
      isOwn: boolean;
      imageUrl: string;
      alt: string;
      timestamp: string;
    };

export type TypingIndicator = {
  isTyping: boolean;
  avatarUrl: string;
  fallback: string;
  name?: string;
};

export type MessageAttachment = {
  name: string;
  sizeLabel: string;
  url: string;
  kind: "image" | "file";
};

export type SendMessagePayload = {
  text: string;
  files: MessageAttachment[];
};
