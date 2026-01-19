import { useCallback, useEffect, useRef, useState } from "react";

type UseFileAttachmentsOptions = {
  maxFiles?: number;

  /**
   * Callback opcional para avisar arquivos duplicados.
   * Ideal para integrar com Sonner no componente pai.
   *
   * Ex:
   * onDuplicateFiles={(dups) => toast(`Arquivo já adicionado: ${dups[0].name}`)}
   */
  onDuplicateFiles?: (duplicates: File[]) => void;
};

/**
 * Converte ArrayBuffer em string hexadecimal.
 * Usado para gerar hash SHA-256.
 */
function bufferToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Gera hash SHA-256 do conteúdo do arquivo.
 *
 * ⚠️ IMPORTANTE:
 * - Isso resolve o problema de Ctrl+V (clipboard),
 *   porque o browser cria um File novo a cada paste,
 *   mas o CONTEÚDO é igual → hash igual.
 */
async function sha256(file: File): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;

  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return bufferToHex(digest);
}

export function useFileAttachments(options: UseFileAttachmentsOptions = {}) {
  const { maxFiles = 10, onDuplicateFiles } = options;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<string | null>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Refs para evitar estado "stale" dentro de funções async.
   */
  const selectedFilesRef = useRef<File[]>([]);
  const previewsRef = useRef<Array<string | null>>([]);

  /**
   * Set com hashes já adicionados.
   * Essa é a base do dedupe perfeito (inclusive clipboard).
   */
  const hashSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    previewsRef.current = filePreviews;
  }, [filePreviews]);

  /**
   * Cleanup no unmount:
   * revoga qualquer preview ainda ativo.
   */
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  /**
   * Função central para adicionar arquivos.
   *
   * Regras:
   * - respeita maxFiles
   * - bloqueia duplicados por HASH (conteúdo)
   * - cria preview apenas para imagens
   *
   * OBS: é async por causa do hash, mas o caller não precisa lidar com Promise.
   */
  const addFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming || incoming.length === 0) return;

      (async () => {
        const currentFiles = selectedFilesRef.current;

        const availableSlots = Math.max(0, maxFiles - currentFiles.length);
        if (availableSlots === 0) return;

        const duplicates: File[] = [];
        const uniqueFiles: File[] = [];

        for (const file of incoming) {
          let hash: string | null = null;

          try {
            hash = await sha256(file);
          } catch {
            hash = null;
          }

          // Se já existe hash → é duplicado (inclusive Ctrl+V)
          if (hash && hashSetRef.current.has(hash)) {
            duplicates.push(file);
            continue;
          }

          uniqueFiles.push(file);

          // Registramos o hash imediatamente para evitar duplicado no mesmo batch
          if (hash) {
            hashSetRef.current.add(hash);
          }
        }

        if (duplicates.length > 0) {
          onDuplicateFiles?.(duplicates);
        }

        const toAdd = uniqueFiles.slice(0, availableSlots);
        if (toAdd.length === 0) return;

        const previewsToAdd: Array<string | null> = toAdd.map((file) => {
          // Preview SOMENTE para imagens
          if (file.type.startsWith("image/")) {
            return URL.createObjectURL(file);
          }
          return null;
        });

        // Atualiza estados de forma alinhada
        setSelectedFiles((prev) => [...prev, ...toAdd]);
        setFilePreviews((prev) => [...prev, ...previewsToAdd]);
      })();
    },
    [maxFiles, onDuplicateFiles]
  );

  /**
   * Handler do input file.
   * Reseta value para permitir escolher o MESMO arquivo novamente.
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const list = event.currentTarget.files;
      if (list && list.length > 0) {
        addFiles(Array.from(list));
      }
      event.currentTarget.value = "";
    },
    [addFiles]
  );

  /**
   * Handler de Ctrl+V (clipboard).
   * Funciona tanto para `clipboard.files` quanto `clipboard.items`
   * (print screen geralmente vem em items).
   */
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const clipboard = event.clipboardData;
      if (!clipboard) return;

      if (clipboard.files && clipboard.files.length > 0) {
        event.preventDefault();
        addFiles(Array.from(clipboard.files));
        return;
      }

      if (clipboard.items && clipboard.items.length > 0) {
        const pasted: File[] = [];

        for (const item of Array.from(clipboard.items)) {
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) pasted.push(file);
          }
        }

        if (pasted.length > 0) {
          event.preventDefault();
          addFiles(pasted);
        }
      }
    },
    [addFiles]
  );

  /**
   * Remove arquivo por índice:
   * - remove File
   * - revoga preview
   * - remove hash do Set (best effort)
   */
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prevFiles) => {
      const file = prevFiles[index];
      const next = prevFiles.filter((_, i) => i !== index);

      if (file) {
        (async () => {
          try {
            const hash = await sha256(file);
            if (hash) hashSetRef.current.delete(hash);
          } catch {
            // Se falhar, não quebra nada
          }
        })();
      }

      return next;
    });

    setFilePreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /**
   * Limpa tudo:
   * - revoga previews
   * - limpa states
   * - limpa hashSet
   */
  const clearFiles = useCallback(() => {
    setFilePreviews((prev) => {
      prev.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      return [];
    });

    setSelectedFiles([]);
    hashSetRef.current.clear();
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    selectedFiles,
    filePreviews, // (string | null)[]
    fileInputRef,
    addFiles,
    removeFile,
    clearFiles,
    handleFileChange,
    handlePaste,
    triggerFileInput,
  };
}
