export interface DashboardResumen {
  fecha_operativa: string;
  zona_horaria: string;
  viajes_hoy: number;
  en_transito: number;
  completados_hoy: number;
  cancelados_hoy: number;
  volumen_transportado: Array<{
    unidad_medida: string;
    cantidad: number;
  }>;
}

export type EstadoViaje = "en_transito" | "completado" | "cancelado";

interface CatalogoViaje {
  id: number;
  nombre: string;
}

export interface ViajeResumen {
  id: string;
  folio: string;
  estado: EstadoViaje;
  camion: {
    id: number;
    placas: string;
    numero_economico: string | null;
  };
  material: CatalogoViaje & { unidad_medida: string };
  ubicacion_origen: CatalogoViaje;
  ubicacion_destino: CatalogoViaje;
  fecha_hora_salida: string;
}

export interface ViajesPaginados {
  data: ViajeResumen[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
