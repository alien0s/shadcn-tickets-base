import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";


type AttachmentPreviewsProps = {
  files: File[];
  previews: Array<string | null>;
  onRemove: (index: number) => void;
};

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function AttachmentPreviews({ files, previews, onRemove }: AttachmentPreviewsProps) {
  if (files.length === 0) return null;

  return (
    <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2">
      {files.map((file, index) => {
        const key = getFileKey(file);
        const previewSrc = previews[index]; // pode ser undefined dependendo do timing

        return (
          <div key={key} className="relative group">
            <div className="relative h-16 w-16 rounded-md overflow-hidden border border-border flex items-center justify-center bg-muted/20">
              {file.type.startsWith("image/") && previewSrc ? (
                <img
                  src={previewSrc}
                  alt={file.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <FileText
                  className={cn(
                    "h-8 w-8",
                    file.type === "application/pdf"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remover ${file.name}`}
              className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
