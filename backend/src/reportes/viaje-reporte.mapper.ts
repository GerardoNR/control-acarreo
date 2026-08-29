import { Viaje } from '../viajes/viaje.entity';

export const VIAJE_REPORTE_HEADERS = [
  'Obra',
  'Fecha Origen',
  'Hora Carga',
  'Fecha Destino',
  'Hora Descarga',
  'Tiempo Efectivo',
  'Folio Origen',
  'Folio Destino',
  'Tipo Origen',
  'Origen',
  'Comentario Origen',
  'Tipo Destino',
  'Destino',
  'Comentario Destino',
  'Placas',
  'Capacidad (m³)',
  'Descripción de Ruta',
  'Distancia Pavimento',
  'Distancia Total',
  'm³Km',
  'Precio primer km',
  'Precio km subsecuente',
  'Coste primer km',
  'Coste km subsecuente',
  'Importe total del acarreo',
  'Material Origen',
  'Material Destino',
  'Checador Origen',
  'Checador Destino',
  'Anotación',
  'Coordenadas Origen',
  'Coordenadas Destino',
  'Unidad de control',
  'Referencia de Estimación',
  'Carga real origen',
  'Carga real destino',
] as const;

export type ReporteViajeValue = string | number | Date | null;

const na = 'N/A';

export class ViajeReporteMapper {
  toRow(viaje: Viaje): ReporteViajeValue[] {
    const llegada = viaje.fecha_hora_llegada;
    const incidencias = (viaje.incidencias ?? [])
      .filter((item) => item.activa)
      .map((item) => item.mensaje || item.tipo)
      .filter(Boolean)
      .join('; ');
    return [
      viaje.proyecto_nombre_snapshot ?? viaje.proyecto?.nombre ?? na,
      viaje.fecha_hora_salida,
      viaje.fecha_hora_salida,
      llegada,
      llegada,
      llegada
        ? (llegada.getTime() - viaje.fecha_hora_salida.getTime()) / 86_400_000
        : null,
      viaje.folio_origen ?? na,
      viaje.folio_destino ?? na,
      viaje.origen_tipo_snapshot ?? viaje.ubicacion_origen?.tipo ?? na,
      viaje.origen_nombre_snapshot ?? viaje.ubicacion_origen?.nombre ?? na,
      viaje.ubicacion_origen?.descripcion ?? na,
      viaje.destino_tipo_snapshot ?? viaje.ubicacion_destino?.tipo ?? na,
      viaje.destino_nombre_snapshot ?? viaje.ubicacion_destino?.nombre ?? na,
      viaje.ubicacion_destino?.descripcion ?? na,
      viaje.placas_snapshot ?? viaje.camion?.placas ?? na,
      this.decimal(viaje.capacidad_aplicada_m3),
      viaje.ruta_descripcion_snapshot ?? na,
      this.decimal(viaje.distancia_pavimento_aplicada),
      this.decimal(viaje.distancia_total_aplicada),
      this.decimal(viaje.m3_km),
      this.decimal(viaje.precio_primer_km_aplicado),
      this.decimal(viaje.precio_km_subsecuente_aplicado),
      this.decimal(viaje.coste_primer_km),
      this.decimal(viaje.coste_km_subsecuente),
      this.decimal(viaje.importe_acarreo),
      viaje.material_origen_nombre_snapshot ?? viaje.material?.nombre ?? na,
      viaje.material_destino_nombre_snapshot ??
        viaje.material_llegada?.nombre ??
        na,
      viaje.checador_origen?.nombre ?? viaje.checador_salida?.nombre ?? na,
      viaje.checador_destino?.nombre ?? viaje.checador_llegada?.nombre ?? na,
      [
        viaje.observaciones_salida,
        viaje.observaciones_llegada,
        viaje.nota,
        incidencias,
      ]
        .filter(Boolean)
        .join('; ') || na,
      na,
      na,
      viaje.unidad_control_nombre_snapshot ??
        viaje.unidad_control?.nombre ??
        na,
      na,
      na,
      na,
    ];
  }

  private decimal(value: string | number | null | undefined): number | null {
    return value == null ? null : Number(value);
  }
}
