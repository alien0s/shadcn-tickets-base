import { useCallback, useState } from "react";
import type { CropArea } from "../types";

type UseImageCropperOptions = {
  initialImage?: string | null;
  initialZoom?: number;
};

export function useImageCropper(options: UseImageCropperOptions = {}) {
  const [imageSrc, setImageSrc] = useState<string | null>(
    options.initialImage ?? null
  );
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [zoom, setZoom] = useState(options.initialZoom ?? 1);

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(typeof reader.result === "string" ? reader.result : null);
      setCropArea(null);
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }, []);

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
