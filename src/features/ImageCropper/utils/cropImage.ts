import type { CropArea } from "../types";

type CropImageOptions = {
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
};

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
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
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context not available");
  }

  canvas.width = Math.round(cropArea.width);
  canvas.height = Math.round(cropArea.height);

  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  const { outputType = "image/jpeg", quality = 0.92 } = options;

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
