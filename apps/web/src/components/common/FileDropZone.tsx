import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Upload, X, File as FileIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  className?: string;
  dropZoneClassName?: string;
  maxFiles?: number;
  accept?: string;
  controller?: {
    selectedFiles: File[];
    filePreviews?: Array<string | null>;
    addFiles: (files: File[]) => void;
    removeFile: (index: number) => void;
    fileInputRef?: React.RefObject<HTMLInputElement | null>;
    triggerFileInput?: () => void;
  };

  /**
   * Se o usuário tentar adicionar arquivo que já existe,
   * chamamos isso pra você disparar Sonner (toast).
   *
   * Ex no parent:
   * onDuplicateFiles={(dups) => toast(`Arquivo já adicionado: ${dups[0].name}`)}
   */
  onDuplicateFiles?: (duplicates: File[]) => void;
}

function getFileKey(file: File) {
  // Identidade prática de arquivo pro front.
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function FileDropZone({
  files: filesProp = [],
  onFilesChange,
  className,
  dropZoneClassName,
  maxFiles = 4,
  accept,
  onDuplicateFiles,
  controller,
}: FileDropZoneProps) {
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const files = controller?.selectedFiles ?? filesProp;
  const fileInputRef = controller?.fileInputRef ?? internalFileInputRef;

  // Set com as chaves dos arquivos atuais, pra checar duplicado rápido (O(1)).
  const existingKeys = useMemo(() => {
    return new Set(files.map(getFileKey));
  }, [files]);

  /**
   * Previews de imagens (blob URLs) criadas UMA vez por arquivo.
   * Evita criar URL nova a cada render e evita vazamento.
   */
  const previewUrlByKey = useMemo(() => {
    const map = new Map<string, string>();

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        map.set(getFileKey(file), URL.createObjectURL(file));
      }
    }

    return map;
  }, [files]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlByKey.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewUrlByKey]);

  /**
   * Adiciona arquivos respeitando:
   * - maxFiles
   * - NÃO duplicar arquivos já adicionados
   *
   * Se houver duplicados, chama onDuplicateFiles([...]) pra você avisar o usuário.
   */
  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      const duplicates: File[] = [];
      const uniqueToAdd: File[] = [];

      for (const file of incoming) {
        const key = getFileKey(file);

        if (existingKeys.has(key)) {
          duplicates.push(file);
          continue;
        }

        uniqueToAdd.push(file);
      }

      // Se teve duplicado, avisamos (pra você usar Sonner)
      if (duplicates.length > 0) {
        onDuplicateFiles?.(duplicates);
      }

      // Respeita limite de slots
      const availableSlots = Math.max(0, maxFiles - files.length);
      if (availableSlots === 0) return;

      const filesToAdd = uniqueToAdd.slice(0, availableSlots);
      if (filesToAdd.length === 0) return;

      if (controller) {
        controller.addFiles(filesToAdd);
      } else {
        onFilesChange?.([...files, ...filesToAdd]);
      }
    },
    [controller, existingKeys, files, maxFiles, onFilesChange, onDuplicateFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.currentTarget.files;
      if (list) addFiles(Array.from(list));

      // Permite selecionar o MESMO arquivo novamente (senão o onChange pode não disparar)
      e.currentTarget.value = "";
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging((prev) => (prev ? prev : true));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const list = e.dataTransfer.files;
      if (list) addFiles(Array.from(list));
    },
    [addFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      if (controller) {
        controller.removeFile(index);
      } else {
        onFilesChange?.(files.filter((_, i) => i !== index));
      }
    },
    [controller, files, onFilesChange]
  );

  const triggerFileInput = useCallback(() => {
    if (controller?.triggerFileInput) {
      controller.triggerFileInput();
      return;
    }
    fileInputRef.current?.click();
  }, [controller, fileInputRef]);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept={accept}
        onChange={handleFileSelect}
      />

      {files.length === 0 ? (
        <div
          role="button"
          tabIndex={0}
          onClick={triggerFileInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") triggerFileInput();
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors outline-none",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50",
            dropZoneClassName
          )}
        >
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-sm font-medium sm:hidden">
            Toque para escolher um arquivo
          </p>
          <p className="text-sm font-medium hidden sm:block">
            Arraste os arquivos aqui ou clique para procurar
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Máx. {maxFiles} arquivos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {files.map((file, index) => {
            const key = getFileKey(file);
            const previewUrl =
              controller?.filePreviews?.[index] ?? previewUrlByKey.get(key);

            return (
              <div
                key={key}
                className="relative group rounded-md border bg-muted/50 overflow-hidden aspect-square flex flex-col items-center justify-center p-2 text-center"
                title={file.name}
              >
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label={`Remover ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
                    draggable={false}
                  />
                ) : (
                  <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
                )}

                <span className="text-[10px] text-muted-foreground w-full truncate px-1 absolute bottom-1 bg-background/50 backdrop-blur-sm">
                  {file.name}
                </span>
              </div>
            );
          })}

          {files.length < maxFiles && (
            <div
              role="button"
              tabIndex={0}
              onClick={triggerFileInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") triggerFileInput();
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer flex flex-col items-center justify-center aspect-square transition-colors outline-none",
                isDragging ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">
                Adicionar
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
