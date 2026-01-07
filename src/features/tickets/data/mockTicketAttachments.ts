import type { AttachmentItem } from "@/features/attachments/types/attachmentTypes";

export const BASE_DOCUMENTS: AttachmentItem[] = [
  { fileName: "error-logs.pdf", fileType: "pdf" },
  { fileName: "invoice_2023.pdf", fileType: "pdf" },
  { fileName: "solution-guide.docx", fileType: "document" },
  { fileName: "user-story.docx", fileType: "document" },
  { fileName: "api-reference.pdf", fileType: "pdf" },
  { fileName: "design-notes.docx", fileType: "document" },
];

export const FALLBACK_IMAGES: AttachmentItem[] = [
  {
    fileName: "screenshot-issue.jpg",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/issue-thumb/320/320",
  },
  {
    fileName: "user-journey-recording.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/journey-thumb/320/320",
  },
  {
    fileName: "console-capture.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/console-thumb/320/320",
  },
  {
    fileName: "payment-flow.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/payment-flow/320/320",
  },
  {
    fileName: "cart-view.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/cart-view/320/320",
  },
  {
    fileName: "shipping-error.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/shipping-error/320/320",
  },
  {
    fileName: "mobile-checkout.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/mobile-checkout/320/320",
  },
  {
    fileName: "refund-steps.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/refund-steps/320/320",
  },
  {
    fileName: "dashboard-stats.png",
    fileType: "image",
    previewUrl: "https://picsum.photos/seed/dashboard-stats/320/320",
  },
];
