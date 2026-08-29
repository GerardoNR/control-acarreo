import { api } from "@/lib/api";
import type { UnidadControl, UnidadControlPayload } from "@/types/configuracion-operativa";

export const unidadesControlService = {
  async list(): Promise<UnidadControl[]> {
    return (await api.get("/unidades-control")).data;
  },
  async create(payload: UnidadControlPayload): Promise<UnidadControl> {
    return (await api.post("/unidades-control", payload)).data;
  },
  async update(id: number, payload: Partial<UnidadControlPayload>): Promise<UnidadControl> {
    return (await api.patch(`/unidades-control/${id}`, payload)).data;
  },
  async setActive(id: number, activo: boolean): Promise<UnidadControl> {
    return (await api.patch(`/unidades-control/${id}/estado`, { activo })).data;
  },
};
