import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitário para combinar classes CSS de forma condicional e resolver conflitos do Tailwind
 * 
 * Combina a funcionalidade de `clsx` (classes condicionais) com `twMerge` (merge de classes Tailwind).
 * Resolve conflitos inteligentemente, mantendo apenas a última classe de cada categoria.
 * 
 * @param inputs - Array de classes CSS, objetos condicionais, ou valores falsy
 * @returns String com classes CSS mescladas e sem conflitos
 * 
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}