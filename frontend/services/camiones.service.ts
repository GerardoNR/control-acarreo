import { api } from "@/lib/api";
import type { Camion, CamionPayload } from "@/types/catalogs";

export const camionesService = {
  async list(): Promise<Camion[]> {
    return (await api.get<Camion[]>("/camiones")).data;
  },
  async create(payload: CamionPayload): Promise<Camion> {
    return (await api.post<Camion>("/camiones", payload)).data;
  },
  async update(id: number, payload: Partial<CamionPayload>): Promise<Camion> {
    return (await api.patch<Camion>(`/camiones/${id}`, payload)).data;
  },
  async setActive(id: number, activo: boolean): Promise<Camion> {
    return (await api.patch<Camion>(`/camiones/${id}/estado`, { activo })).data;
  },
};
