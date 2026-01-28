import type { AuthUser } from "../types";

/**
 * Chaves no localStorage
 */
const USER_KEY = "supportdesk:user";
const TOKEN_KEY = "supportdesk:token";

/**
 * Recupera o usuário salvo no localStorage
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Salva o usuário autenticado no localStorage
 */
export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove o usuário salvo
 */
export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
}

/**
 * Salva o token JWT no localStorage
 */
export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Recupera o token JWT do localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove o token JWT do localStorage
 */
export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Limpa todos os dados de autenticação
 */
export function clearAuth(): void {
  clearStoredUser();
  clearStoredToken();
}