import type { AuthUser } from "../types";

const AUTH_HANDOFF_WINDOW_KEY = "__thurnos_auth_handoff__:";

type AuthHandoffPayload = {
  user: AuthUser;
  token: string;
  supabaseToken?: string;
};

export function saveAuthHandoffToWindowName(payload: AuthHandoffPayload): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(payload);
  window.name = `${AUTH_HANDOFF_WINDOW_KEY}${toBase64Url(raw)}`;
}

export function hasPendingAuthHandoff(): boolean {
  if (typeof window === "undefined") return false;
  return (window.name || "").startsWith(AUTH_HANDOFF_WINDOW_KEY);
}

export function consumeAuthHandoff(): AuthHandoffPayload | null {
  if (typeof window === "undefined") return null;

  const rawWindowName = window.name || "";
  if (!rawWindowName.startsWith(AUTH_HANDOFF_WINDOW_KEY)) return null;

  try {
    const encodedPayload = rawWindowName.slice(AUTH_HANDOFF_WINDOW_KEY.length);
    const decoded = fromBase64Url(encodedPayload);
    window.name = "";
    return JSON.parse(decoded) as AuthHandoffPayload;
  } catch {
    window.name = "";
    return null;
  }
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}
