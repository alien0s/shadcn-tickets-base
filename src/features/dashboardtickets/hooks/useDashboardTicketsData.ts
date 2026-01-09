import { useEffect, useState } from "react";
import type { DashboardTicketsData } from "../types";
import { MOCK_DASHBOARD_TICKETS_DATA } from "../data/mockDashboardTicketsData";

const dashboardTicketsApi = {
  async fetch(): Promise<DashboardTicketsData> {
    await new Promise((resolve) => setTimeout(resolve, 480));
    return JSON.parse(JSON.stringify(MOCK_DASHBOARD_TICKETS_DATA));
  },
};

export function useDashboardTicketsData() {
  const [data, setData] = useState<DashboardTicketsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    const result = await dashboardTicketsApi.fetch();
    setData(result);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return {
    data,
    isLoading,
    loadDashboard,
  };
}
