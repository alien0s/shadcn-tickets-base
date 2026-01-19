import { Paperclip } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AttachmentPickerProps = {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  accept?: string;
  onTrigger: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function AttachmentPicker({
  fileInputRef,
  accept,
  onTrigger,
  onFileChange,
}: AttachmentPickerProps) {
  return (
    <>
      {/* Input escondido: o click real acontece via ref + onTrigger no parent */}
      <input
        type="file"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={onFileChange}
        accept={accept}
      />

      {/* Melhor prática shadcn: manter TooltipProvider no layout global.
          Aqui usamos só Tooltip/Trigger/Content. */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onTrigger}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Anexar arquivo"
            title="Anexar arquivo"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="bg-black text-white px-2 py-1 text-xs border-none rounded-md"
        >
          <p>Anexar arquivo ou imagem</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
