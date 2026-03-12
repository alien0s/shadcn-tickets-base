const REDIRECT_LOCK_KEY = "thurnos:host-redirect-lock";
const REDIRECT_LOCK_TTL_MS = 1800;

type RedirectLock = {
  target: string;
  ts: number;
};

export function replaceWithRedirectLock(targetUrl: string): void {
  if (typeof window === "undefined") return;

  const normalizedTarget = normalizeUrl(targetUrl);
  const normalizedCurrent = normalizeUrl(window.location.href);

  if (normalizedTarget === normalizedCurrent) return;
  if (isLocked(normalizedTarget)) return;

  writeLock(normalizedTarget);
  window.location.replace(targetUrl);
}

function isLocked(targetUrl: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(REDIRECT_LOCK_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as RedirectLock;
    const isFresh = Date.now() - parsed.ts < REDIRECT_LOCK_TTL_MS;
    return isFresh && parsed.target === targetUrl;
  } catch {
    return false;
  }
}

function writeLock(targetUrl: string): void {
  try {
    const payload: RedirectLock = {
      target: targetUrl,
      ts: Date.now(),
    };
    window.sessionStorage.setItem(REDIRECT_LOCK_KEY, JSON.stringify(payload));
  } catch {
    // no-op
  }
}

function normalizeUrl(value: string): string {
  try {
    return new URL(value).toString();
  } catch {
    return value;
  }
}

