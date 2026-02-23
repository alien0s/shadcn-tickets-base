import React, {
  useCallback,
  useEffect,
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

type AttachmentsController = {
  selectedFiles: File[];
  filePreviews: Array<string | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaste: (event: React.ClipboardEvent) => void;
  triggerFileInput: () => void;
};

type Props = {
  onSend?: (payload: SendMessagePayload) => void;
  onTyping?: (isTyping: boolean) => void;
  attachments?: AttachmentsController;
  disabled?: boolean;
  showPreviews?: boolean;
};

export type MessageInputHandle = {
  focus: () => void;
};

export const MessageInput = forwardRef<MessageInputHandle, Props>(
  function MessageInput(
    { onSend, onTyping, attachments, disabled = false, showPreviews = true },
    ref
  ) {
    const [message, setMessage] = useState("");
    const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);

    const internalAttachments = useFileAttachments({
      maxFiles: 10,
      onDuplicateFiles: (duplicates) => {
        if (duplicates.length === 0) return;
        const names = duplicates.map((file) => file.name).join(", ");
        toast.warning(`Arquivo já adicionado: ${names}`);
      },
    });

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
      if (disabled) return;
      textareaRef.current?.focus({ preventScroll: true });
    }, [disabled]);

    useImperativeHandle(
      ref,
      () => ({
        focus: focusInput,
      }),
      [focusInput]
    );

    const stopTyping = useCallback(() => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      onTyping?.(false);
    }, [onTyping]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);

      if (!onTyping) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (!value.trim()) {
        onTyping(false);
        return;
      }

      onTyping(true);

      typingTimeoutRef.current = window.setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 1200);
    };

    const submitMessage = useCallback(() => {
      if (disabled) return;
      const trimmed = message.trim();
      if (!trimmed && selectedFiles.length === 0) return;

      onSend?.({ text: trimmed, files: selectedFiles });

      setMessage("");
      clearFiles();
      focusInput();
      stopTyping();
    }, [disabled, message, selectedFiles, onSend, clearFiles, focusInput, stopTyping]);

    useEffect(() => {
      if (typeof window === "undefined") return;

      const mediaQuery = window.matchMedia("(max-width: 767px)");
      const updateAutoFocus = () => setShouldAutoFocus(!mediaQuery.matches);

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
      focusInput();
    }, [shouldAutoFocus, focusInput]);

    useEffect(() => {
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        onTyping?.(false);
      };
    }, [onTyping]);

    return (
      <div
        className="px-3 pb-4 bg-background max-[767px]:pb-[calc(0.75rem+var(--safe-bottom, env(safe-area-inset-bottom)))]"
        onClick={focusInput}
      >
        <div className="relative flex flex-col border rounded-md shadow-sm bg-background transition-all">
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              submitMessage();
            }}
          >
            {showPreviews ? (
              <AttachmentPreviews
                files={selectedFiles}
                previews={filePreviews}
                onRemove={removeFile}
              />
            ) : null}

            <Textarea
              rows={1}
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onBlur={stopTyping}
              onPaste={handlePaste}
              placeholder="Digite uma mensagem"
              disabled={disabled}
              className="resize-none border-0 shadow-none focus-visible:ring-0 px-4 py-3 min-h-[50px] max-h-[200px] text-base"
              style={{ height: "auto" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage();
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-4">
                <AttachmentPicker
                  fileInputRef={fileInputRef}
                  onFileChange={handleFileChange}
                  onTrigger={triggerFileInput}
                  accept="image/*,.pdf,.doc,.docx"
                  disabled={disabled}
                />
              </div>

              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full ml-auto"
                aria-label="Enviar mensagem"
                disabled={disabled}
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
