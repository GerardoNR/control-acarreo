import type { Proyecto, Ubicacion } from "./catalogs";

export interface RutaAcarreo {
  id: number;
  proyecto: Proyecto;
  clave: string;
  ubicacion_origen: Ubicacion;
  ubicacion_destino: Ubicacion;
  descripcion: string | null;
  distancia_pavimento: string;
  distancia_total: string;
  vigente_desde: string;
  vigente_hasta: string | null;
  activo: boolean;
}

export interface RutaAcarreoPayload {
  proyecto_id: number;
  clave: string;
  ubicacion_origen_id: number;
  ubicacion_destino_id: number;
  descripcion?: string;
  distancia_pavimento: number;
  distancia_total: number;
  vigente_desde: string;
  vigente_hasta?: string;
  activo?: boolean;
}

export interface UnidadControl {
  id: number;
  proyecto: Proyecto;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface UnidadControlPayload {
  proyecto_id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}
