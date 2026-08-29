import type { Material, Proyecto, Ubicacion } from './catalogs';
import type { RutaAcarreo } from './configuracion-operativa';
export type TipoCobroTarifa = 'POR_VOLUMEN' | 'POR_DISTANCIA_ESCALONADA';

export interface Tarifa {
    id: number; proyecto: Proyecto; material: Material; 
    ubicacion_origen: Ubicacion; ubicacion_destino: Ubicacion; ruta_acarreo: RutaAcarreo | null; tipo_cobro: TipoCobroTarifa;
    unidad_medida: string; precio_unitario: string | null; precio_primer_km: string | null; precio_km_subsecuente: string | null; vigente_desde: string;
    vigente_hasta: string | null; activo: boolean; creado_en: string; actualizado_en: string; }

export interface TarifaPayload { 
    proyecto_id: number; material_id: number; ubicacion_origen_id: number;
    ubicacion_destino_id: number; ruta_acarreo_id?: number; tipo_cobro: TipoCobroTarifa;
    precio_unitario?: number; precio_primer_km?: number; precio_km_subsecuente?: number;
    vigente_desde: string; vigente_hasta?: string; activo?: boolean; }
