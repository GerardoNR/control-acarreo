import { api } from "@/lib/api";
import type { Proyecto, ProyectoPayload } from "@/types/catalogs";

export const proyectosService = {
  async list(): Promise<Proyecto[]> {
    return (await api.get<Proyecto[]>("/proyectos")).data;
  },
  async create(payload: ProyectoPayload): Promise<Proyecto> {
    return (await api.post<Proyecto>("/proyectos", payload)).data;
  },
  async update(id: number, payload: Partial<ProyectoPayload>): Promise<Proyecto> {
    return (await api.patch<Proyecto>(`/proyectos/${id}`, payload)).data;
  },
  async setActive(id: number, activo: boolean): Promise<Proyecto> {
    return (await api.patch<Proyecto>(`/proyectos/${id}/estado`, { activo })).data;
  },
};
