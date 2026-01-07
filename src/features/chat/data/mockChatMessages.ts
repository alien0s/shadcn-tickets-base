import type { ChatMessage, TypingIndicator } from "../types/chatTypes";

export const mockTypingIndicator: TypingIndicator = {
  isTyping: true,
  avatarUrl:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s",
  fallback: "OP",
  name: "Cliente",
};

export const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    type: "text",
    isOwn: false,
    content: "Ola, estou com um problema para acessar o sistema.",
    timestamp: "10:30",
  },
  {
    id: "2",
    type: "text",
    isOwn: true,
    content: "Ola! Pode me enviar um print do erro que aparece?",
    timestamp: "10:32",
  },
  {
    id: "3",
    type: "file",
    isOwn: false,
    fileName: "error-logs.pdf",
    fileSize: "2.4 KB",
    fileUrl: "#",
    timestamp: "10:35",
  },
  {
    id: "4",
    type: "image",
    isOwn: true,
    imageUrl:
      "https://64.media.tumblr.com/f43536e7eaf1c5ef943e4879e44f7611/tumblr_oxg6vi8kBV1wx5fjeo1_1280.jpg",
    alt: "Screenshot",
    timestamp: "10:36",
  },
  {
    id: "5",
    type: "file",
    isOwn: true,
    fileName: "solution-guide.pdf",
    fileSize: "1.2 MB",
    fileUrl: "#",
    timestamp: "10:38",
  },
  {
    id: "6",
    type: "image",
    isOwn: false,
    imageUrl:
      "https://i.pinimg.com/736x/54/ff/2f/54ff2f6e6b229c3bd0bdbdef4c4c89ad.jpg",
    alt: "Error screenshot",
    timestamp: "10:40",
  },
];
