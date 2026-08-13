import { EstadoViaje } from '../enums/estado-viaje.enum';

interface CatalogoResponse {
  id: number;
  nombre: string;
}

export interface ViajeResponse {
  id: string;
  id_legacy: number | null;
  folio: string;
  proyecto: CatalogoResponse;
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
