import { clearAuth } from "./auth-storage";

export const AUTH_SESSION_EXPIRED_EVENT = "supportdesk:auth-session-expired";

type JwtPayload = {
  exp?: number;
};

let lastSessionExpirationAt = 0;

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4;
    const padded =
      padding === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padding), "=");

    return atob(padded);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;

  try {
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, clockSkewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds + clockSkewSeconds;
}

export function isUnauthorizedApiResponse(
  status: number,
  payload?: { error?: { statusCode?: number; code?: string } } | null
): boolean {
  return status === 401 || payload?.error?.statusCode === 401 || payload?.error?.code === "UNAUTHORIZED";
}

export function expireAuthSession(): void {
  clearAuth();

  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastSessionExpirationAt < 1500) {
    return;
  }

  lastSessionExpirationAt = now;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
}
