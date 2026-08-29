import { EstadoViaje } from '../enums/estado-viaje.enum';
import {
  OrigenIncidenciaViaje,
  TipoIncidenciaViaje,
} from '../../incidencias-viaje/incidencia-viaje.entity';

interface CatalogoResponse {
  id: number;
  nombre: string;
}

export interface ViajeResponse {
  id: string;
  id_legacy: number | null;
  folio: string;
  folio_origen: string | null;
  folio_destino: string | null;
  ticket: {
    id: string;
    codigo_ticket: string;
    fecha_generacion: Date;
  } | null;
  proyecto: CatalogoResponse;
  orden_acarreo: { id: number; folio: string } | null;
  material: CatalogoResponse & { unidad_medida: string };
  camion: {
    id: number;
    placas: string;
    numero_economico: string | null;
    nfc_tag_uid: string;
  };
  chofer: CatalogoResponse & {
    apellido_paterno: string | null;
    apellido_materno: string | null;
  };
  ubicacion_origen: CatalogoResponse & { tipo: string };
  ubicacion_destino: CatalogoResponse & { tipo: string };
  ubicacion_destino_real: (CatalogoResponse & { tipo: string }) | null;
  material_llegada: CatalogoResponse | null;
  ruta_acarreo: {
    id: number;
    clave: string;
    descripcion: string | null;
  } | null;
  unidad_control: CatalogoResponse | null;
  unidad_control_sugerida: CatalogoResponse | null;
  calculo_economico: {
    capacidad_m3: string;
    distancia_pavimento_km: string;
    distancia_total_km: string;
    m3_km: string;
    coste_primer_km: string;
    coste_km_subsecuente: string;
    importe: string;
  } | null;
  incidencias: Array<{
    id: string;
    tipo: TipoIncidenciaViaje;
    origen: OrigenIncidenciaViaje;
    mensaje: string;
    datos: Record<string, unknown> | null;
    activa: boolean;
    detectada_en: Date;
  }>;
  checador_salida: CatalogoResponse;
  checador_llegada: CatalogoResponse | null;
  administrador_cancelacion: CatalogoResponse | null;
  cantidad_salida: string;
  cantidad_llegada: string | null;
  unidad_medida: string;
  fecha_hora_salida: Date;
  fecha_hora_llegada: Date | null;
  fecha_hora_cancelacion: Date | null;
  estado: EstadoViaje;
  observaciones_salida: string | null;
  observaciones_llegada: string | null;
  motivo_cancelacion: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

export interface ViajesPaginadosResponse {
  data: ViajeResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
