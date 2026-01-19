import type { CropArea } from "../types";

type CropImageOptions = {
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
};

/**
 * SSR safety: este util é client-only (usa DOM e Canvas).
 * Se alguém tentar chamar no servidor, falha de forma explícita e previsível.
 */
function assertClient() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("cropImage can only be used in the browser (client-side).");
  }
}

function shouldUseCrossOrigin(source: string) {
  // DataURL e blob/objectURL não precisam de crossOrigin.
  if (source.startsWith("data:")) return false;
  if (source.startsWith("blob:")) return false;

  // Para http/https, só faz sentido setar crossOrigin (quando o servidor permitir).
  return source.startsWith("http://") || source.startsWith("https://");
}

function loadImage(source: string) {
  assertClient();

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    // ✅ crossOrigin só quando faz sentido (evita falhas desnecessárias)
    if (shouldUseCrossOrigin(source)) {
      image.crossOrigin = "anonymous";
    }

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = source;
  });
}

export async function cropImage(
  imageSrc: string,
  cropArea: CropArea,
  options: CropImageOptions = {}
) {
  assertClient();

  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context not available");
  }

  // ✅ mantém consistência com o tamanho final do canvas
  const sx = Math.round(cropArea.x);
  const sy = Math.round(cropArea.y);
  const sw = Math.round(cropArea.width);
  const sh = Math.round(cropArea.height);

  canvas.width = sw;
  canvas.height = sh;

  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

  const { outputType = "image/jpeg", quality = 0.92 } = options;

  // ✅ fallback previsível caso toBlob não exista (extremamente raro)
  if (!canvas.toBlob) {
    const dataUrl = canvas.toDataURL(outputType, quality);
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image"));
          return;
        }
        resolve(blob);
      },
      outputType,
      quality
    );
  });
}
