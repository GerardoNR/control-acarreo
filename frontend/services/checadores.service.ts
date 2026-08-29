import { api } from "@/lib/api";
import type { Checador, CreateChecadorPayload, UpdateChecadorPayload } from "@/types/catalogs";

export const checadoresService = {
  async list(): Promise<Checador[]> {
    return (await api.get<Checador[]>("/checadores")).data;
  },
  async create(payload: CreateChecadorPayload): Promise<Checador> {
    return (await api.post<Checador>("/checadores", payload)).data;
  },
  async update(id: number, payload: UpdateChecadorPayload): Promise<Checador> {
    return (await api.patch<Checador>(`/checadores/${id}`, payload)).data;
  },
  async remove(id: number): Promise<void> { await api.delete(`/checadores/${id}`); },
};
