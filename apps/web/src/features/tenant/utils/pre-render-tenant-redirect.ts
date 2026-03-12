import { getStoredToken, getStoredUser } from "@/features/auth/utils/auth-storage";
import { buildTenantUrlForCurrentHost, getCurrentSubdomain } from "./subdomain";
import { resolveTenantSlugFromUser } from "./tenant-slug";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/forgot-password"]);

export function resolvePreRenderTenantRedirect(locationValue: Location): string | null {
  const currentSubdomain = getCurrentSubdomain(locationValue.hostname);
  if (currentSubdomain) return null;

  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) return null;
  if (user.role === "root") return null;

  const tenantSlug = resolveTenantSlugFromUser(user);
  if (!tenantSlug) return null;

  const target = new URL(buildTenantUrlForCurrentHost(tenantSlug, locationValue));
  if (PUBLIC_PATHS.has(target.pathname)) {
    target.pathname = "/grade";
    target.search = "";
    target.hash = "";
  }

  if (target.toString() === locationValue.href) return null;
  return target.toString();
}
