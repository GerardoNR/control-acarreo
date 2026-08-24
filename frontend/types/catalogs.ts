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

export interface Camion extends CatalogBase {
  placas: string;
  numero_economico: string | null;
  nfc_tag_uid: string;
  capacidad_m3: string;
  tipo_camion: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
}

export interface CamionPayload {
  placas: string;
  numero_economico?: string;
  nfc_tag_uid: string;
  capacidad_m3: number;
  tipo_camion?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
}

export interface Chofer extends CatalogBase {
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  telefono: string | null;
  licencia: string | null;
  vigencia_licencia: string | null;
}

export interface ChoferPayload {
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono?: string;
  licencia?: string;
  vigencia_licencia?: string;
}

export interface Checador extends CatalogBase {
  nombre: string;
  telefono: string | null;
  usuario: string;
  ultimo_acceso: string | null;
}

export interface CreateChecadorPayload {
  nombre: string;
  telefono?: string;
  usuario: string;
  password: string;
}

export interface UpdateChecadorPayload {
  nombre?: string;
  telefono?: string;
  usuario?: string;
  password?: string;
}
