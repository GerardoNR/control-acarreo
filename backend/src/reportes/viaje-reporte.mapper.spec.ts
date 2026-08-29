import { EstadoViaje } from '../viajes/enums/estado-viaje.enum';
import {
  ViajeReporteMapper,
  VIAJE_REPORTE_HEADERS,
} from './viaje-reporte.mapper';

describe('ViajeReporteMapper', () => {
  it('produce las 36 columnas en el orden administrativo y conserva folios como texto', () => {
    const salida = new Date('2026-08-28T13:45:57.000Z');
    const llegada = new Date('2026-08-28T14:04:00.000Z');
    const row = new ViajeReporteMapper().toRow({
      fecha_hora_salida: salida,
      fecha_hora_llegada: llegada,
      folio_origen: '260828237521757501703',
      folio_destino: null,
      proyecto_nombre_snapshot: 'Obra histórica',
      placas_snapshot: '44ES8M',
      capacidad_aplicada_m3: '14.500',
      origen_tipo_snapshot: 'banco',
      origen_nombre_snapshot: 'Banco',
      destino_tipo_snapshot: 'frente',
      destino_nombre_snapshot: 'Frente',
      material_origen_nombre_snapshot: 'Material',
      material_destino_nombre_snapshot: null,
      ruta_descripcion_snapshot: 'Ruta histórica',
      distancia_pavimento_aplicada: '3.125',
      distancia_total_aplicada: '7.875',
      m3_km: '114.19',
      precio_primer_km_aplicado: '25.1234',
      precio_km_subsecuente_aplicado: '8.5678',
      coste_primer_km: '364.29',
      coste_km_subsecuente: '264.00',
      importe_acarreo: '628.29',
      observaciones_salida: 'Salida',
      incidencias: [{ activa: true, mensaje: 'Destino diferente' }],
      proyecto: { nombre: 'Actual' },
      camion: { placas: 'ACTUAL' },
      ubicacion_origen: {
        nombre: 'Actual origen',
        tipo: 'banco',
        descripcion: null,
      },
      ubicacion_destino: {
        nombre: 'Actual destino',
        tipo: 'frente',
        descripcion: null,
      },
      material: { nombre: 'Actual material' },
      material_llegada: null,
      checador_salida: { nombre: 'Origen' },
      checador_llegada: null,
      checador_origen: null,
      checador_destino: null,
      unidad_control: { nombre: 'Unidad' },
      unidad_control_nombre_snapshot: 'Unidad histórica',
      estado: EstadoViaje.COMPLETADO,
      nota: null,
    } as never);
    expect(VIAJE_REPORTE_HEADERS).toHaveLength(36);
    expect(row).toHaveLength(36);
    expect(row[6]).toBe('260828237521757501703');
    expect(typeof row[6]).toBe('string');
    expect(row[5]).toBeCloseTo(18.05 / (24 * 60), 5);
    expect(row[29]).toContain('Destino diferente');
    expect(row[30]).toBe('N/A');
    expect(row[34]).toBe('N/A');
  });
});
