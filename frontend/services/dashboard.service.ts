import { api } from "@/lib/api";
import type { DashboardResumen } from "@/types/dashboard";

export const dashboardService = {
  async getResumen(): Promise<DashboardResumen> {
    const { data } = await api.get<DashboardResumen>("/dashboard/resumen");
    return data;
  },
};
