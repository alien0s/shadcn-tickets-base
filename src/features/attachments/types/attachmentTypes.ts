export type AttachmentItem = {
  fileName: string;
  fileType: "pdf" | "image" | "document";
  previewUrl?: string;
};

export type AttachmentViewerItem = {
  id: string;
  url: string;
  type: "image" | "file";
  name: string;
  sharedBy?: string;
  sharedDate?: string;
};
