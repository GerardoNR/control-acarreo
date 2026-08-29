import { api } from "@/lib/api";
import type { PapeleraItem, TipoPapelera } from "@/types/papelera";

export const papeleraService = {
  async list(): Promise<PapeleraItem[]> {
    return (await api.get<PapeleraItem[]>("/papelera")).data;
  },
  async restore(tipo: TipoPapelera, id: number): Promise<void> {
    await api.patch(`/papelera/${tipo}/${id}/restaurar`);
  },
};
