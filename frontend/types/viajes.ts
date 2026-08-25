export type EstadoViaje = "en_transito" | "completado" | "cancelado";

export interface ViajeCatalogo {
  id: number;
  nombre: string;
}

export interface Viaje {
  id: string;
  id_legacy: number | null;
  folio: string;
  proyecto: ViajeCatalogo;
  material: ViajeCatalogo & { unidad_medida: string };
  camion: { id: number; placas: string; numero_economico: string | null; nfc_tag_uid: string };
  chofer: ViajeCatalogo & { apellido_paterno: string | null; apellido_materno: string | null };
  ubicacion_origen: ViajeCatalogo & { tipo: string };
  ubicacion_destino: ViajeCatalogo & { tipo: string };
  checador_salida: ViajeCatalogo;
  checador_llegada: ViajeCatalogo | null;
  administrador_cancelacion: ViajeCatalogo | null;
  cantidad_salida: string;
  cantidad_llegada: string | null;
  unidad_medida: string;
  fecha_hora_salida: string;
  fecha_hora_llegada: string | null;
  fecha_hora_cancelacion: string | null;
  estado: EstadoViaje;
  observaciones_salida: string | null;
  observaciones_llegada: string | null;
  motivo_cancelacion: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ViajesQuery {
  estado?: EstadoViaje;
  folio?: string;
  proyecto_id?: number;
  material_id?: number;
  camion_id?: number;
  chofer_id?: number;
  ubicacion_origen_id?: number;
  ubicacion_destino_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  page: number;
  limit: number;
}

export interface ViajesPaginatedResponse {
  data: Viaje[];
  meta: { page: number; limit: number; total: number; total_pages: number };
}

export interface CancelarViajePayload {
  motivo_cancelacion: string;
}
