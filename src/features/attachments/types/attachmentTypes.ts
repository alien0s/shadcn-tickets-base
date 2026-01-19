// attachmentTypes.ts

/**
 * Representa um anexo em LISTAS / GRIDS
 * Ex: sidebar, lista de anexos, tabs de imagens/documentos
 */
export type AttachmentItem = {
  fileName: string; // nome original do arquivo (ex: "error-log.pdf")

  /**
   * Tipo do arquivo para controle de UI
   * - image: imagens com preview
   * - pdf: PDF
   * - document: doc, docx, etc
   */
  fileType: "image" | "pdf" | "document";

  /**
   * URL de preview (opcional):
   * - para imagens: thumbnail ou ObjectURL
   * - para documentos: normalmente undefined
   * Pode vir da API ou ser gerado no front
   */
  previewUrl?: string;
};

/**
 * Representa um anexo NO VISUALIZADOR (fullscreen / carousel)
 */
export type AttachmentViewerItem = {
  id: string; // id único do anexo (API: uuid ou number)

  /**
   * URL do arquivo completo:
   * - imagem: url da imagem
   * - arquivo: url de download
   */
  url: string;

  /**
   * Tipo discriminado para renderização no viewer
   * - image: renderiza <img>
   * - file: renderiza card de download
   */
  type: "image" | "file";

  name: string; // nome do arquivo exibido no viewer

  sharedBy?: string; // nome de quem enviou (futuro: user.displayName)

  /**
   * Data ISO (recomendado para API)
   * Ex: "2025-05-25T12:00:00.000Z"
   * A UI decide como formatar (ex: "25 May")
   */
  sharedAt?: string;
};
