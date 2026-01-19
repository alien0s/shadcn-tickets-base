import { useCallback, useEffect, useRef, useState } from "react";
import type { CropArea } from "../types";

type UseImageCropperOptions = {
  initialImage?: string | null;
  initialZoom?: number;
};

export function useImageCropper(options: UseImageCropperOptions = {}) {
  const initialZoom = options.initialZoom ?? 1;

  const [imageSrc, setImageSrc] = useState<string | null>(
    options.initialImage ?? null
  );
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [zoom, setZoom] = useState(initialZoom);

  // ✅ evita setState após unmount durante leitura do FileReader
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (!isMountedRef.current) return;

        setImageSrc(typeof reader.result === "string" ? reader.result : null);
        setCropArea(null);
        setZoom(1); // mantém comportamento original: ao carregar novo arquivo, zoom volta pra 1
      };

      reader.onerror = () => {
        // ✅ falha previsível: não deixa estado em meia-boca
        if (!isMountedRef.current) return;

        setImageSrc(null);
        setCropArea(null);
        setZoom(1);
      };

      reader.onabort = () => {
        // ✅ abort também reseta de forma previsível
        if (!isMountedRef.current) return;

        setImageSrc(null);
        setCropArea(null);
        setZoom(1);
      };

      reader.readAsDataURL(file);
    },
    [] // não depende de nada
  );

  const clear = useCallback(() => {
    setImageSrc(null);
    setCropArea(null);
    setZoom(1);
  }, []);

  return {
    imageSrc,
    setImageSrc,
    cropArea,
    setCropArea,
    zoom,
    setZoom,
    loadFile,
    clear,
  };
}
