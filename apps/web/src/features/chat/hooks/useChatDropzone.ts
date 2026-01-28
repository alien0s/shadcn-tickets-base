import { useCallback, useMemo, useRef, useState } from "react";

type UseChatDropzoneOptions = {
  onDropFiles: (files: File[]) => void;
  existingFiles?: File[]; // ✅ lista atual pra bloquear duplicados
};

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function hasFiles(e: React.DragEvent) {
  // Evita ativar drag state quando arrastam texto/links.
  return Array.from(e.dataTransfer.types).includes("Files");
}

export function useChatDropzone({
  onDropFiles,
  existingFiles = [],
}: UseChatDropzoneOptions) {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragCounterRef = useRef(0);

  // Set com as keys já existentes (dedupe rápido)
  const existingKeys = useMemo(
    () => new Set(existingFiles.map(getFileKey)),
    [existingFiles]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();

    // Contador evita flicker de dragenter/dragleave em elementos filhos
    dragCounterRef.current += 1;
    setIsDraggingFiles(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();

    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFiles(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();

      dragCounterRef.current = 0;
      setIsDraggingFiles(false);

      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length === 0) return;

      // remove duplicados comparando com os já anexados
      const uniqueFiles = dropped.filter(
        (file) => !existingKeys.has(getFileKey(file))
      );

      if (uniqueFiles.length === 0) return;

      onDropFiles(uniqueFiles);
    },
    [existingKeys, onDropFiles]
  );

  return {
    isDraggingFiles,
    bind: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
