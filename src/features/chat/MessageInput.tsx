import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  onSend?: (payload: { text: string; files: { name: string; sizeLabel: string; url: string; kind: "image" | "file" }[] }) => void;
};

export type MessageInputHandle = {
  focus: () => void;
};

export const MessageInput = forwardRef<MessageInputHandle, Props>(function MessageInput(
  { onSend },
  ref
) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track previews for cleanup
  const previewsRef = useRef<string[]>([]);

  // Update ref whenever previews change
  useEffect(() => {
    previewsRef.current = filePreviews;
  }, [filePreviews]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addFiles = (files: File[]) => {
    if (selectedFiles.length >= 10) return;

    const availableSlots = 10 - selectedFiles.length;
    const newFiles = Array.from(files).slice(0, availableSlots);

    if (newFiles.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const clearFiles = () => {
    setFilePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const submitMessage = () => {
    const trimmed = message.trim();
    if (!trimmed && selectedFiles.length === 0) return;

    const filesToSend = selectedFiles.map((file, index) => {
      const kind: "image" | "file" = file.type.startsWith("image/") ? "image" : "file";
      return {
        name: file.name,
        sizeLabel: formatFileSize(file.size),
        url: filePreviews[index] ?? "",
        kind,
      };
    });

    onSend?.({ text: trimmed, files: filesToSend });
    setMessage("");
    clearFiles();
    focusInput();
  };

  const focusInput = () => {
    textareaRef.current?.focus();
  };

  useImperativeHandle(ref, () => ({
    focus: focusInput,
  }));

  useEffect(() => {
    focusInput();
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      addFiles(Array.from(e.clipboardData.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="px-3 pb-4 bg-background" onClick={focusInput}>
      <div className="relative flex flex-col border rounded-md shadow-sm bg-background transition-all">

        <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          submitMessage();
        }}
      >
          {/* File Previews Area */}
          {selectedFiles.length > 0 && (
            <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden border border-border flex items-center justify-center bg-muted/20">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={filePreviews[index]}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className={`h-8 w-8 ${file.type === 'application/pdf' ? 'text-red-500' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Textarea
            rows={1}
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onPaste={handlePaste}
            placeholder="Digite uma mensagem"
            className="resize-none border-0 shadow-none focus-visible:ring-0 px-4 py-3 min-h-[50px] max-h-[200px] text-base"
            style={{ height: "auto" }}
            autoFocus
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
              {/* Document Attachment */}
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleFileClick}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black text-white px-2 py-1 text-xs border-none rounded-md">
                    <p>Attach file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full ml-auto"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
