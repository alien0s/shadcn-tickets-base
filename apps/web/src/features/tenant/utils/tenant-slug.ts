import type { AuthUser } from "@/features/auth/types";
import { toTenantSlug } from "./subdomain";

export function resolveTenantSlugFromUser(user: AuthUser): string | null {
  if (user.tenant_slug) {
    const normalizedSlug = toTenantSlug(user.tenant_slug);
    if (normalizedSlug) return normalizedSlug;
  }

  if (user.tenant_name) {
    const byName = toTenantSlug(user.tenant_name);
    if (byName) return byName;
  }

  const fallbackId = user.tenant_id || user.entity_id;
  if (!fallbackId) return null;

  return `tenant-${fallbackId.slice(0, 8).toLowerCase()}`;
}
