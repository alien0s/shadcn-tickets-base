const LOCALHOST = "localhost";

export function toTenantSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getCurrentSubdomain(hostname: string): string | null {
  const normalized = hostname.toLowerCase();

  if (normalized === LOCALHOST) return null;
  if (normalized.endsWith(`.${LOCALHOST}`)) {
    const subdomain = normalized.slice(0, -(LOCALHOST.length + 1));
    return subdomain || null;
  }

  const parts = normalized.split(".");
  if (parts.length <= 2) return null;

  return parts[0] || null;
}

export function buildTenantUrlForCurrentHost(slug: string, locationValue: Location): string {
  const { protocol, hostname, port, pathname, search, hash } = locationValue;
  const normalizedSlug = toTenantSlug(slug);
  if (!normalizedSlug) {
    throw new Error("Slug de tenant inválido");
  }

  const lowerHostname = hostname.toLowerCase();
  const hostWithoutPort = lowerHostname.endsWith(`.${LOCALHOST}`)
    ? `${normalizedSlug}.${LOCALHOST}`
    : replaceOrPrependSubdomain(lowerHostname, normalizedSlug);

  const portSegment = port ? `:${port}` : "";
  return `${protocol}//${hostWithoutPort}${portSegment}${pathname}${search}${hash}`;
}

export function buildRootUrlForCurrentHost(
  locationValue: Location,
  pathnameOverride?: string,
  options?: { preserveSearchAndHash?: boolean }
): string {
  const { protocol, hostname, port, pathname, search, hash } = locationValue;
  const lowerHostname = hostname.toLowerCase();
  const targetPathname = pathnameOverride ?? pathname;
  const preserveSearchAndHash = options?.preserveSearchAndHash ?? true;

  const hostWithoutPort = lowerHostname.endsWith(`.${LOCALHOST}`)
    ? LOCALHOST
    : removeSubdomain(lowerHostname);

  const portSegment = port ? `:${port}` : "";
  return `${protocol}//${hostWithoutPort}${portSegment}${targetPathname}${preserveSearchAndHash ? search : ""}${preserveSearchAndHash ? hash : ""}`;
}

function replaceOrPrependSubdomain(hostname: string, slug: string): string {
  const parts = hostname.split(".");
  if (parts.length <= 2) {
    return `${slug}.${hostname}`;
  }

  const root = parts.slice(-2).join(".");
  return `${slug}.${root}`;
}

function removeSubdomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}
