export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};
/**
 * Área de recorte da imagem.
 *
 * - Coordenadas em pixels
 * - Referentes à imagem original (não ao canvas final)
 * - Usado tanto pelo Cropper quanto pelo util de crop
 */