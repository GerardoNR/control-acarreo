import { api } from "@/lib/api";
import type { Chofer, ChoferPayload } from "@/types/catalogs";

export const choferesService = {
  async list(): Promise<Chofer[]> {
    return (await api.get<Chofer[]>("/choferes")).data;
  },
  async create(payload: ChoferPayload): Promise<Chofer> {
    return (await api.post<Chofer>("/choferes", payload)).data;
  },
  async update(id: number, payload: Partial<ChoferPayload>): Promise<Chofer> {
    return (await api.patch<Chofer>(`/choferes/${id}`, payload)).data;
  },
  async setActive(id: number, activo: boolean): Promise<Chofer> {
    return (await api.patch<Chofer>(`/choferes/${id}/estado`, { activo })).data;
  },
};
