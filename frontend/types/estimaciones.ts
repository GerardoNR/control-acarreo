import type { Proyecto } from './catalogs';
import type { Viaje } from './viajes';
import type { Tarifa } from './tarifas';
export type EstadoEstimacion = 'BORRADOR' | 'CERRADA' | 'FACTURADA' | 'PAGADA' | 'CANCELADA';
export interface EstimacionResumen { id: number; folio: string; proyecto: Proyecto; 
    fecha_desde: string; fecha_hasta: string; estado: EstadoEstimacion; viajes: number; cantidad: string;
    importe_realizado: string; importe_facturado: string; importe_pagado: string; por_cobrar: string;
    fecha_facturacion: string | null; referencia_factura: string | null; observaciones: string | null; 
    creado_en: string; actualizado_en: string; }

export interface EstimacionesResponse { resumen: { total_estimaciones: number; importe_realizado: string; 
    importe_facturado: string; importe_pagado: string; por_cobrar: string }; data: EstimacionResumen[]; }

    
export interface EstimacionDetalle extends EstimacionResumen { detalles: Array<{ id: number; viaje: Viaje; 
    tarifa: Tarifa; cantidad: string; unidad_medida: string; precio_unitario_aplicado: string; 
    importe: string }>; pagos: Array<{ id: number; fecha: string; importe: string; referencia: string | null;
         observaciones: string | null; creado_en: string }>; }
