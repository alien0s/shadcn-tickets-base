import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardTicketsData } from "../types";
import { MOCK_DASHBOARD_TICKETS_DATA } from "../data/mockDashboardTicketsData";

const dashboardTicketsApi = {
  async fetch(): Promise<DashboardTicketsData> {
    await new Promise((resolve) => setTimeout(resolve, 480));
    // Mock clone profundo simples (ok para objetos JSON)
    return JSON.parse(JSON.stringify(MOCK_DASHBOARD_TICKETS_DATA)) as DashboardTicketsData;
  },
};

export function useDashboardTicketsData() {
  const [data, setData] = useState<DashboardTicketsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ evita setState após unmount (race condition simples e previsível)
  const isMountedRef = useRef(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await dashboardTicketsApi.fetch();

      if (!isMountedRef.current) return; // ✅ componente desmontou, não atualiza estado
      setData(result);
    } finally {
      // ✅ garante que loading não fica preso mesmo se der erro
      if (!isMountedRef.current) return;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadDashboard();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDashboard]); // ✅ deps corretas (loadDashboard é estável)

  return {
    data,
    isLoading,
    loadDashboard, // ✅ estável para passar como prop (onRefresh)
  };
}
