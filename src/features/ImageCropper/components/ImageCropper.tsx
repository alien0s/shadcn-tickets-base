import { Cropper } from "@origin-space/image-cropper";
import { cn } from "@/lib/utils";
import type { CropArea } from "../types";

type ImageCropperProps = {
  image: string;
  aspectRatio?: number;
  className?: string;
  imageClassName?: string;
  cropAreaClassName?: string;
  description?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onCropChange?: (area: CropArea | null) => void;
};

export function ImageCropper({
  image,
  aspectRatio = 1,
  className,
  imageClassName,
  cropAreaClassName,
  description = "Use mouse ou touch para ajustar o recorte da imagem.",
  zoom,
  onZoomChange,
  onCropChange,
}: ImageCropperProps) {
  return (
    <Cropper.Root
      image={image}
      aspectRatio={aspectRatio}
      zoom={zoom}
      onZoomChange={onZoomChange}
      onCropChange={onCropChange}
      className={cn(
        "relative flex h-80 w-full cursor-move touch-none items-center justify-center overflow-hidden rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Cropper.Description className="sr-only">
        {description}
      </Cropper.Description>
      <Cropper.Image
        className={cn(
          "pointer-events-none h-full w-full select-none object-cover",
          imageClassName
        )}
      />
      <Cropper.CropArea
        className={cn(
          "pointer-events-none absolute border-2 border-dashed border-background shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]",
          cropAreaClassName
        )}
      />
    </Cropper.Root>
  );
}
