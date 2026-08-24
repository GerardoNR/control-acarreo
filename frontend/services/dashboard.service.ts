import { api } from "@/lib/api";
import type { DashboardResumen, ViajesPaginados } from "@/types/dashboard";

const VIAJES_RECIENTES_LIMIT = 5;

export const dashboardService = {
  async getResumen(): Promise<DashboardResumen> {
    const { data } = await api.get<DashboardResumen>("/dashboard/resumen");
    return data;
  },

  async getViajesRecientes(): Promise<ViajesPaginados> {
    const { data } = await api.get<ViajesPaginados>("/viajes", {
      params: { page: 1, limit: VIAJES_RECIENTES_LIMIT },
    });
    return data;
  },
};
