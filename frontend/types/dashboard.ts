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
  actividad_ultimos_7_dias: Array<{
    fecha: string;
    salidas: number;
    completados: number;
    cancelados: number;
  }>;
  volumen_ultimos_7_dias: Array<{
    fecha: string;
    unidad_medida: string;
    cantidad: number;
  }>;
  operacion_actual: {
    viajes_en_transito: number;
    camiones_operando: number;
    proyectos_activos: number;
  };
}
