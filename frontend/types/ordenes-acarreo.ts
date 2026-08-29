import type { Material, Proyecto, Ubicacion } from './catalogs';
import type { Viaje } from './viajes';
import type { RutaAcarreo, UnidadControl } from './configuracion-operativa';
import type { Tarifa } from './tarifas';
export type EstadoOrdenAcarreo = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
export interface OrdenAcarreo { id: number; folio: string; proyecto: Proyecto; material: Material;
     ubicacion_origen: Ubicacion; ubicacion_destino: Ubicacion; ruta_acarreo: RutaAcarreo | null; unidad_control: UnidadControl | null; tarifa: Tarifa | null; cantidad_solicitada: string;
      unidad_medida: string; fecha_inicio: string; fecha_fin: string | null; 
      estado: EstadoOrdenAcarreo; observaciones: string | null; transportado: string; pendiente: string;
       excedente: string; avance_porcentaje: number; viajes_completados: number; creado_en: string;
        actualizado_en: string; }

export interface OrdenAcarreoDetalle extends OrdenAcarreo { 
    viajes: Array<Pick<Viaje, 'id' | 'folio' | 'camion' | 'chofer' | 'unidad_medida' | 'fecha_hora_salida' | 'fecha_hora_llegada' | 'estado'> & { cantidad: string }>; }
export interface OrdenAcarreoPayload {
    proyecto_id: number; material_id: number; ubicacion_origen_id: number; ubicacion_destino_id: number;
    ruta_acarreo_id?: number; unidad_control_id?: number; tarifa_id?: number;
    cantidad_solicitada: number; fecha_inicio: string; fecha_fin?: string; observaciones?: string; }
