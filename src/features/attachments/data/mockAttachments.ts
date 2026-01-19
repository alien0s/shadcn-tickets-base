// mockAttachments.ts
import type { AttachmentViewerItem } from "../types/attachmentTypes";

/**
 * MOCK somente para desenvolvimento.
 * Quando a API real entrar:
 * - esse arquivo pode ser removido
 * - os dados virão de request (ex.: /tickets/:id/attachments)
 */
export const mockAttachmentViewerItems: AttachmentViewerItem[] = [
  {
    id: "1", // id estável (na API pode ser number ou uuid)
    url: "https://www.minhatatuagem.com/wp-content/uploads/2022/07/fotos-tumblr-9.jpg", // url pública (mock)
    type: "image", // união discriminada: facilita render condicional no viewer
    name: "screenshot-issue.jpg", // nome original do arquivo
    sharedBy: "Agent Lisa", // autor (na API pode ser userId + displayName)
    sharedAt: "2025-05-25T12:00:00.000Z", // ✅ ISO (melhor pra formatar no front)
  },
  {
    id: "2",
    url: "https://cdn.britannica.com/59/256159-050-32D4A1F1/Tumblr-site-on-smartphone.jpg",
    type: "image",
    name: "error-details.jpg",
    sharedBy: "You",
    sharedAt: "2025-05-24T12:00:00.000Z",
  },
  {
    id: "3",
    url: "https://picsum.photos/seed/3/1200/800", // seed garante imagem "estável" (não muda a cada reload)
    type: "image",
    name: "bug-screenshot.png",
    sharedBy: "Agent Lisa",
    sharedAt: "2025-05-23T12:00:00.000Z",
  },
  {
    id: "4",
    url: "https://store-images.s-microsoft.com/image/apps.19691.14420356529270456.a0e62d2f-10e7-480b-b5a1-cb70a39b4d1b.3af40891-43ad-4549-9351-96f5c86cae65",
    type: "image",
    name: "console-log.jpg",
    sharedBy: "You",
    sharedAt: "2025-05-22T12:00:00.000Z",
  },
];
