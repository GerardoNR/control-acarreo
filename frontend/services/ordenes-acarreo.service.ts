import { api } from '@/lib/api';
import type { EstadoOrdenAcarreo, OrdenAcarreo, OrdenAcarreoDetalle, OrdenAcarreoPayload } from '@/types/ordenes-acarreo';
export const ordenesAcarreoService = {
  async list(params?: { buscar?: string; proyecto_id?: number; material_id?: number; estado?: EstadoOrdenAcarreo; desde?: string; hasta?: string }): Promise<OrdenAcarreo[]> { return (await api.get('/ordenes-acarreo', { params })).data; },
  async get(id: number): Promise<OrdenAcarreoDetalle> { return (await api.get(`/ordenes-acarreo/${id}`)).data; },
  async create(payload: OrdenAcarreoPayload): Promise<OrdenAcarreoDetalle> { return (await api.post('/ordenes-acarreo', payload)).data; },
  async update(id: number, payload: Partial<OrdenAcarreoPayload>): Promise<OrdenAcarreoDetalle> { return (await api.patch(`/ordenes-acarreo/${id}`, payload)).data; },
  async cancel(id: number): Promise<OrdenAcarreoDetalle> { return (await api.patch(`/ordenes-acarreo/${id}/cancelar`)).data; },
};
