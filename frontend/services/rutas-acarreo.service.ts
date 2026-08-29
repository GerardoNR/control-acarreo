import { api } from "@/lib/api";
import type { RutaAcarreo, RutaAcarreoPayload } from "@/types/configuracion-operativa";

export const rutasAcarreoService = {
  async list(): Promise<RutaAcarreo[]> {
    return (await api.get("/rutas-acarreo")).data;
  },
  async create(payload: RutaAcarreoPayload): Promise<RutaAcarreo> {
    return (await api.post("/rutas-acarreo", payload)).data;
  },
  async update(id: number, payload: Partial<RutaAcarreoPayload>): Promise<RutaAcarreo> {
    return (await api.patch(`/rutas-acarreo/${id}`, payload)).data;
  },
  async setActive(id: number, activo: boolean): Promise<RutaAcarreo> {
    return (await api.patch(`/rutas-acarreo/${id}/estado`, { activo })).data;
  },
};
