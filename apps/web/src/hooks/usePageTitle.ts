import { useEffect } from "react";
import { BRAND_NAME } from "@/config/brand";

/**
 * Hook que atualiza o título da página (document.title)
 * Formata automaticamente com o nome da marca
 * 
 * @param title - Título específico da página (ex: "Dashboard", "Configurações")
 * 
 * @example
 * // Em qualquer componente de página
 * usePageTitle("Dashboard");
 * // Resultado: "Dashboard | [BRAND_NAME]"
 * 
 * @example
 * // Título dinâmico
 * const userName = "João Silva";
 * usePageTitle(`Perfil de ${userName}`);
 * // Resultado: "Perfil de João Silva | [BRAND_NAME]"
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    // Verifica se está no ambiente do navegador (SSR-safe)
    if (typeof document === "undefined") return;

    // Atualiza o título da página com formato padrão
    document.title = `${title} | ${BRAND_NAME}`;

    // Opcional: Cleanup para restaurar título anterior
    // return () => {
    //   document.title = BRAND_NAME;
    // };
  }, [title]);
}