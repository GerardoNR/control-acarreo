import { api } from "@/lib/api";
import type { Material, MaterialPayload } from "@/types/catalogs";

export const materialesService = {
  async list(): Promise<Material[]> {
    return (await api.get<Material[]>("/materiales")).data;
  },
  async create(payload: MaterialPayload): Promise<Material> {
    return (await api.post<Material>("/materiales", payload)).data;
  },
  async update(id: number, payload: Partial<MaterialPayload>): Promise<Material> {
    return (await api.patch<Material>(`/materiales/${id}`, payload)).data;
  },
  async remove(id: number): Promise<void> { await api.delete(`/materiales/${id}`); },
};
