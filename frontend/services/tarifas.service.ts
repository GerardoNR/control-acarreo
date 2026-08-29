import { api } from '@/lib/api';
import type { Tarifa, TarifaPayload } from '@/types/tarifas';
export const tarifasService = { async list(): Promise<Tarifa[]> { return (await api.get('/tarifas')).data; }, async create(payload: TarifaPayload): Promise<Tarifa> { return (await api.post('/tarifas', payload)).data; }, async update(id: number, payload: Partial<TarifaPayload>): Promise<Tarifa> { return (await api.patch(`/tarifas/${id}`, payload)).data; } };
