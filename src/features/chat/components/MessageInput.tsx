// MessageInput.tsx (caixa de enviar mensagem)
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { SendMessagePayload } from "../types/chatTypes";
import { useFileAttachments } from "@/features/UploadFileMessage/hooks/useFileAttachments";
import { AttachmentPreviews } from "@/features/UploadFileMessage/components/AttachmentPreviews";
import { AttachmentPicker } from "@/features/UploadFileMessage/components/AttachmentPicker";
import { formatFileSize } from "@/features/UploadFileMessage/utils/formatFileSize";

type AttachmentsController = {
  selectedFiles: File[];
  filePreviews: Array<string | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>; // ✅ ref pode ser null no primeiro render
  removeFile: (index: number) => void;
  clearFiles: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaste: (event: React.ClipboardEvent) => void;
  triggerFileInput: () => void;
};

type Props = {
  onSend?: (payload: SendMessagePayload) => void;
  attachments?: AttachmentsController; // permite controller externo (ChatWindow) ou interno (hook)
};

export type MessageInputHandle = {
  focus: () => void;
};

export const MessageInput = forwardRef<MessageInputHandle, Props>(
  function MessageInput({ onSend, attachments }, ref) {
    const [message, setMessage] = useState(""); // texto digitado
    const [shouldAutoFocus, setShouldAutoFocus] = useState(false); // autofocus só no desktop
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Controller interno (caso ChatWindow não injete attachments externos)
    const internalAttachments = useFileAttachments({
      maxFiles: 10,
      onDuplicateFiles: (duplicates) => {
        if (duplicates.length === 0) return;
        const names = duplicates.map((file) => file.name).join(", ");
        toast.warning(`Arquivo já adicionado: ${names}`);
      },
    });

    // Usa controller externo (ChatWindow) se existir; senão usa o interno
    const controller = attachments ?? internalAttachments;

    const {
      selectedFiles,
      filePreviews,
      fileInputRef,
      removeFile,
      clearFiles,
      handleFileChange,
      handlePaste,
      triggerFileInput,
    } = controller;

    const focusInput = useCallback(() => {
      // preventScroll reduz o "pulo" do teclado no iOS
      textareaRef.current?.focus({ preventScroll: true });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: focusInput,
      }),
      [focusInput]
    );

    // Monta o payload de arquivos (memo evita recriar array em render sem necessidade)
    const filesToSend = useMemo(() => {
      return selectedFiles.map((file, index) => {
        const kind: "image" | "file" = file.type.startsWith("image/")
          ? "image"
          : "file";

        const preview = filePreviews[index]; // pode ser string ou null
        return {
          name: file.name,
          sizeLabel: formatFileSize(file.size),
          url: typeof preview === "string" ? preview : "", // fallback seguro
          kind,
        };
      });
    }, [selectedFiles, filePreviews]);

    const submitMessage = useCallback(() => {
      const trimmed = message.trim();
      if (!trimmed && selectedFiles.length === 0) return; // nada para enviar

      onSend?.({ text: trimmed, files: filesToSend });

      setMessage(""); // limpa campo
      clearFiles(); // limpa anexos + revoga previews no hook
      focusInput(); // devolve foco
    }, [message, selectedFiles.length, onSend, filesToSend, clearFiles, focusInput]);

    // Decide autofocus: desktop sim, mobile não
    useEffect(() => {
      if (typeof window === "undefined") return;

      const mediaQuery = window.matchMedia("(max-width: 767px)"); // < md
      const updateAutoFocus = () => setShouldAutoFocus(!mediaQuery.matches); // desktop true

      updateAutoFocus();

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", updateAutoFocus);
      } else {
        mediaQuery.addListener(updateAutoFocus);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", updateAutoFocus);
        } else {
          mediaQuery.removeListener(updateAutoFocus);
        }
      };
    }, []);

    useEffect(() => {
      if (!shouldAutoFocus) return;
      focusInput(); // foca quando entra em desktop
    }, [shouldAutoFocus, focusInput]);

    return (
      <div
        className="px-3 pb-4 bg-background max-[767px]:pb-[calc(0.75rem+var(--safe-bottom, env(safe-area-inset-bottom)))]"
        onClick={focusInput} // clique na área foca o input
      >
        <div className="relative flex flex-col border rounded-md shadow-sm bg-background transition-all">
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              submitMessage();
            }}
          >
            {/* Previews dos anexos */}
            <AttachmentPreviews
              files={selectedFiles}
              previews={filePreviews} // (string|null)[]
              onRemove={removeFile}
            />

            <Textarea
              rows={1}
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste} // cola imagem/arquivo do clipboard (Ctrl+V)
              placeholder="Digite uma mensagem"
              className="resize-none border-0 shadow-none focus-visible:ring-0 px-4 py-3 min-h-[50px] max-h-[200px] text-base"
              style={{ height: "auto" }}
              onKeyDown={(e) => {
                // Enter envia / Shift+Enter quebra linha
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage();
                }
              }}
              onInput={(e) => {
                // Auto-resize baseado no conteúdo
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-4">
                <AttachmentPicker
                  fileInputRef={fileInputRef} // ✅ agora tipado com null também
                  onFileChange={handleFileChange}
                  onTrigger={triggerFileInput}
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>

              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full ml-auto"
                aria-label="Enviar mensagem"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);
