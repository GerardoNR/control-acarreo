export interface ReportesResumen {
  viajes_totales: number;
  en_transito: number;
  completados: number;
  cancelados: number;
  viajes_por_proyecto: { proyecto_id: number; nombre: string | null; viajes_totales: number }[];
  viajes_por_material: { material_id: number; nombre: string | null; unidad_medida: string; viajes_totales: number; cantidad_transportada: number }[];
  viajes_por_camion: { camion_id: number; numero_economico: string | null; placas: string; viajes_totales: number }[];
}

export interface ReporteViaje {
  id: string;
  folio: string;
  fecha_hora_salida: string;
  fecha_hora_llegada: string | null;
  proyecto: { id: number; nombre: string };
  camion: { id: number; numero_economico: string | null; placas: string };
  chofer: { id: number; nombre: string };
  ubicacion_origen: { id: number; nombre: string; tipo: string };
  ubicacion_destino: { id: number; nombre: string; tipo: string };
  material: { id: number; nombre: string };
  cantidad_salida: string;
  cantidad_llegada: string | null;
  unidad_medida: string;
  estado: "en_transito" | "completado" | "cancelado";
  checador_salida: { id: number; nombre: string };
  checador_llegada: { id: number; nombre: string } | null;
  orden_acarreo: { id: number; folio: string } | null;
}

export interface ReportesViajesQuery {
  folio?: string;
  estado?: "en_transito" | "completado" | "cancelado";
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
  todos?: boolean;
}

export interface ReportesViajesResponse {
  data: ReporteViaje[];
  meta: { page: number; limit: number; total: number; total_pages: number; todos?: boolean };
}
