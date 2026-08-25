import { api } from "@/lib/api";
import type { CancelarViajePayload, Viaje, ViajesPaginatedResponse, ViajesQuery } from "@/types/viajes";

export const viajesService = {
  async list(query: ViajesQuery): Promise<ViajesPaginatedResponse> {
    return (await api.get<ViajesPaginatedResponse>("/viajes", { params: query })).data;
  },
  async getById(id: string): Promise<Viaje> {
    return (await api.get<Viaje>(`/viajes/${id}`)).data;
  },
  async cancel(id: string, payload: CancelarViajePayload): Promise<Viaje> {
    return (await api.patch<Viaje>(`/viajes/${id}/cancelar`, payload)).data;
  },
};
