import { api } from '@/lib/api';
import type { EstimacionDetalle, EstimacionesResponse } from '@/types/estimaciones';
import type { Viaje } from '@/types/viajes';
export const estimacionesService = {
  async list(): Promise<EstimacionesResponse> { return (await api.get('/estimaciones')).data; },
  async get(id: number): Promise<EstimacionDetalle> { return (await api.get(`/estimaciones/${id}`)).data; },
  async eligible(params: { proyecto_id: number; fecha_desde: string; fecha_hasta: string; orden_acarreo_id?: number }): Promise<Viaje[]> { return (await api.get('/estimaciones/viajes-elegibles', { params })).data; },
  async create(payload: { proyecto_id: number; fecha_desde: string; fecha_hasta: string; viaje_ids: string[]; observaciones?: string }): Promise<EstimacionDetalle> { return (await api.post('/estimaciones', payload)).data; },
  async close(id: number): Promise<EstimacionDetalle> { return (await api.patch(`/estimaciones/${id}/cerrar`)).data; },
  async invoice(id: number, payload: { importe_facturado: number; fecha_facturacion: string; referencia_factura?: string }): Promise<EstimacionDetalle> { return (await api.patch(`/estimaciones/${id}/facturar`, payload)).data; },
  async pay(id: number, payload: { fecha: string; importe: number; referencia?: string; observaciones?: string }): Promise<EstimacionDetalle> { return (await api.post(`/estimaciones/${id}/pagos`, payload)).data; },
};
