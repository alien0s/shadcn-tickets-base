import { useCallback, useEffect, useMemo, useState } from "react";
import type { TenantInfo, UpdateTenantInfoRequest } from "@ticket-system/types";
import { useAuth } from "@/features/auth";
import { api } from "@/lib/api";

type UseTenantInfoResult = {
  tenantInfo: TenantInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  updateTenantInfo: (payload: UpdateTenantInfoRequest) => Promise<TenantInfo>;
};

export function useTenantInfo(): UseTenantInfoResult {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? user?.entity_id ?? "";
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (tenantId) {
      params.set("tenant_id", tenantId);
    }

    const query = params.toString();
    return query ? `/tenant/current?${query}` : "/tenant/current";
  }, [tenantId]);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadTenantInfo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<TenantInfo>(endpoint);

        if (!isActive) return;
        setTenantInfo(data);
      } catch (requestError) {
        if (!isActive) return;
        const message =
          requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a organizacao.";

        setTenantInfo(null);
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTenantInfo();

    return () => {
      isActive = false;
    };
  }, [endpoint]);

  const updateTenantInfo = useCallback(async (payload: UpdateTenantInfoRequest) => {
    setIsUpdating(true);

    try {
      const { data } = await api.patchWithMeta<TenantInfo>(endpoint, payload);
      setTenantInfo(data);
      setError(null);
      return data;
    } finally {
      setIsUpdating(false);
    }
  }, [endpoint]);

  return { tenantInfo, isLoading, isUpdating, error, updateTenantInfo };
}
