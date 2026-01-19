import type { AuthUser } from "../types";

/**
 * Chave única no localStorage.
 * Namespace evita conflito com outras apps/domínios.
 */
const STORAGE_KEY = "supportdesk:user";

/**
 * Recupera o usuário salvo no localStorage.
 * - Retorna null se:
 *   - estiver em SSR
 *   - não existir dado salvo
 *   - o JSON estiver corrompido
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null; // SSR safety

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null; // nada salvo

  try {
    return JSON.parse(raw) as AuthUser; // parse seguro
  } catch {
    // Se o JSON estiver inválido/corrompido, ignora
    return null;
  }
}

/**
 * Salva o usuário autenticado no localStorage.
 * - Usado após login bem-sucedido
 */
export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return; // SSR safety

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * Remove o usuário salvo.
 * - Usado no logout
 */
export function clearStoredUser(): void {
  if (typeof window === "undefined") return; // SSR safety

  window.localStorage.removeItem(STORAGE_KEY);
}
