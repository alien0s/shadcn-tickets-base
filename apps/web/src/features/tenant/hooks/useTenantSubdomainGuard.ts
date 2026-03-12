import { useEffect, useMemo } from "react";
import type { AuthUser } from "@/features/auth/types";
import { buildTenantUrlForCurrentHost, getCurrentSubdomain } from "../utils/subdomain";
import { clearAuth, getStoredSupabaseToken, getStoredToken } from "@/features/auth/utils/auth-storage";
import { saveAuthHandoffToWindowName } from "@/features/auth/utils/auth-handoff";
import { replaceWithRedirectLock } from "../utils/redirect-lock";
import { resolveTenantSlugFromUser } from "../utils/tenant-slug";

export function useTenantSubdomainGuard(user: AuthUser | null, isAuthenticated: boolean) {
  const shouldEnforceTenantSubdomain = Boolean(isAuthenticated && user && user.role !== "root");

  const expectedSlug = useMemo(() => {
    if (!shouldEnforceTenantSubdomain || !user) return null;
    return resolveTenantSlugFromUser(user);
  }, [shouldEnforceTenantSubdomain, user]);

  useEffect(() => {
    if (!shouldEnforceTenantSubdomain || !expectedSlug) return;
    if (!user) return;
    if (window.location.pathname === "/login" || window.location.pathname === "/signup" || window.location.pathname === "/forgot-password") {
      return;
    }

    const currentSubdomain = getCurrentSubdomain(window.location.hostname);
    if (currentSubdomain === expectedSlug) return;

    const targetUrl = new URL(buildTenantUrlForCurrentHost(expectedSlug, window.location));
    const token = getStoredToken();

    if (token) {
      saveAuthHandoffToWindowName({
        user,
        token,
        supabaseToken: getStoredSupabaseToken() ?? undefined,
      });
      // Remove sessão do host atual para não causar re-login involuntário no domínio raiz.
      clearAuth();
    }

    replaceWithRedirectLock(targetUrl.toString());
  }, [expectedSlug, shouldEnforceTenantSubdomain, user]);
}
