import { api } from "@/lib/api";
import type { SuspensionEntityType, SuspensionPayload, SuspensionSummary } from "@/types/catalogs";

export const suspensionesService = {
  async active(type: SuspensionEntityType): Promise<Record<number, SuspensionSummary>> {
    return (await api.get<Record<number, SuspensionSummary>>(`/suspensiones/${type}/activas`)).data;
  },
  async suspend(type: SuspensionEntityType, id: number, payload: SuspensionPayload): Promise<SuspensionSummary> {
    return (await api.post<SuspensionSummary>(`/suspensiones/${type}/${id}`, payload)).data;
  },
  async resume(type: SuspensionEntityType, id: number): Promise<void> {
    await api.patch(`/suspensiones/${type}/${id}/reanudar`);
  },
};
