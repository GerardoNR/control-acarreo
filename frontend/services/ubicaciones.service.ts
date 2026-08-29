import { api } from "@/lib/api";
import type { Ubicacion, UbicacionPayload } from "@/types/catalogs";

export const ubicacionesService = {
  async list(): Promise<Ubicacion[]> {
    return (await api.get<Ubicacion[]>("/ubicaciones")).data;
  },
  async create(payload: UbicacionPayload): Promise<Ubicacion> {
    return (await api.post<Ubicacion>("/ubicaciones", payload)).data;
  },
  async update(id: number, payload: Partial<UbicacionPayload>): Promise<Ubicacion> {
    return (await api.patch<Ubicacion>(`/ubicaciones/${id}`, payload)).data;
  },
  async remove(id: number): Promise<void> { await api.delete(`/ubicaciones/${id}`); },
};
