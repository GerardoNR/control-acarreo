export interface CatalogBase {
  id: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Proyecto extends CatalogBase {
  nombre: string;
  clave: string | null;
  desarrolladora: string | null;
  descripcion: string | null;
  nota_ruta: string | null;
}

export interface ProyectoPayload {
  nombre: string;
  clave?: string;
  desarrolladora?: string;
  descripcion?: string;
  nota_ruta?: string;
}

export interface Material extends CatalogBase {
  nombre: string;
  unidad_medida: string;
  descripcion: string | null;
}

export interface MaterialPayload {
  nombre: string;
  unidad_medida: string;
  descripcion?: string;
}

export type TipoUbicacion = "banco" | "frente";

export interface Ubicacion extends CatalogBase {
  proyecto: Proyecto;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string | null;
  referencia: string | null;
}

export interface UbicacionPayload {
  proyecto_id: number;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion?: string;
  referencia?: string;
}
