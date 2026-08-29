import { Repository, SelectQueryBuilder } from 'typeorm';
import ExcelJS from 'exceljs';
import type { ConsultarViajesDto } from '../viajes/dto/consultar-viajes.dto';
import { EstadoViaje } from '../viajes/enums/estado-viaje.enum';
import { Viaje } from '../viajes/viaje.entity';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  it('devuelve conteos y agrupaciones con valores numéricos', async () => {
    const queryBuilders = [
      crearQueryBuilder({
        viajes_totales: '4',
        en_transito: '1',
        completados: '2',
        cancelados: '1',
      }),
      crearQueryBuilder([
        { id: '1', nombre: 'Proyecto Norte', viajes_totales: '4' },
      ]),
      crearQueryBuilder([
        {
          id: '2',
          nombre: 'Terraplén',
          unidad_medida: 'm3',
          viajes_totales: '4',
          cantidad_transportada: '29.000',
        },
      ]),
      crearQueryBuilder([
        {
          id: '3',
          numero_economico: 'ECO-001',
          placas: 'ABC-123',
          viajes_totales: '4',
        },
      ]),
    ];
    const repository = {
      createQueryBuilder: jest
        .fn()
        .mockImplementation(() => queryBuilders.shift()),
    } as unknown as Repository<Viaje>;

    const resultado = await new ReportesService(repository).resumen();

    expect(resultado).toEqual({
      viajes_totales: 4,
      en_transito: 1,
      completados: 2,
      cancelados: 1,
      viajes_por_proyecto: [
        { proyecto_id: 1, nombre: 'Proyecto Norte', viajes_totales: 4 },
      ],
      viajes_por_material: [
        {
          material_id: 2,
          nombre: 'Terraplén',
          unidad_medida: 'm3',
          viajes_totales: 4,
          cantidad_transportada: 29,
        },
      ],
      viajes_por_camion: [
        {
          camion_id: 3,
          numero_economico: 'ECO-001',
          placas: 'ABC-123',
          viajes_totales: 4,
        },
      ],
    });
  });

  it('guarda en el XLSX la configuración de impresión y visualización', async () => {
    const service = crearServicioExportacion(3);

    const archivo = await service.exportarExcel(crearFiltros());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(archivo);
    const sheet = workbook.getWorksheet('Worksheet');

    expect(sheet).toBeDefined();
    expect(sheet?.pageSetup).toMatchObject({
      orientation: 'landscape',
      paperSize: 1,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printArea: 'A1:AJ4',
      printTitlesRow: '1:1',
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.6,
        bottom: 0.6,
        header: 0.25,
        footer: 0.25,
      },
    });
    expect(sheet?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(sheet?.autoFilter).toEqual('A1:AJ1');
    expect(sheet?.getRow(2).alignment).toMatchObject({
      vertical: 'middle',
      wrapText: true,
    });
    expect(sheet?.columns.map((column) => column.width)).toEqual([
      28, 13, 12, 13, 12, 15, 20, 20, 14, 26, 30, 14, 26, 30, 14, 16, 34, 18,
      16, 14, 18, 22, 18, 22, 24, 24, 24, 22, 22, 38, 20, 20, 22, 24, 18, 18,
    ]);
  });
});

function crearFiltros(): ConsultarViajesDto {
  return { page: 1, limit: 20 };
}

function crearServicioExportacion(total: number) {
  const viajes = Array.from({ length: total }, (_, index) => crearViaje(index));
  const queryBuilder = crearQueryBuilderExportacion(viajes);
  const repository = {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  } as unknown as Repository<Viaje>;
  return new ReportesService(repository);
}

function crearQueryBuilderExportacion(viajes: Viaje[]) {
  const builder = {
    innerJoinAndSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getMany: jest.fn().mockResolvedValue(viajes),
  };
  for (const metodo of [
    'innerJoinAndSelect',
    'leftJoinAndSelect',
    'orderBy',
    'addOrderBy',
  ] as const) {
    builder[metodo].mockReturnValue(builder);
  }
  return builder as unknown as SelectQueryBuilder<Viaje>;
}

function crearViaje(index: number): Viaje {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    folio: `VIA-2026-${String(index + 1).padStart(6, '0')}`,
    fecha_hora_salida: new Date('2026-08-27T14:00:00.000Z'),
    fecha_hora_llegada: new Date('2026-08-27T15:00:00.000Z'),
    proyecto: { nombre: 'Proyecto Norte' },
    camion: { numero_economico: 'ECO-001', placas: 'ABC-123' },
    chofer: {
      nombre: 'María',
      apellido_paterno: 'González',
      apellido_materno: 'López',
    },
    ubicacion_origen: { nombre: 'Banco Norte', tipo: 'banco' },
    ubicacion_destino: { nombre: 'Frente Sur', tipo: 'frente' },
    material: { nombre: 'Material de banco' },
    cantidad_salida: 12.5,
    cantidad_llegada: 12.25,
    unidad_medida: 'm3',
    estado: EstadoViaje.COMPLETADO,
    checador_salida: { nombre: 'Checador Uno' },
    checador_llegada: { nombre: 'Checador Dos' },
    orden_acarreo: null,
    folio_banco: null,
    impreso: false,
    fecha_impresion: null,
    observaciones_salida: null,
    observaciones_llegada: null,
    motivo_cancelacion: null,
  } as unknown as Viaje;
}


function crearQueryBuilder(resultado: unknown) {
  const builder = {
    select: jest.fn(),
    addSelect: jest.fn(),
    innerJoin: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    orderBy: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };
  for (const metodo of [
    'select',
    'addSelect',
    'innerJoin',
    'groupBy',
    'addGroupBy',
    'orderBy',
  ] as const) {
    builder[metodo].mockReturnValue(builder);
  }
  builder.getRawOne.mockResolvedValue(resultado);
  builder.getRawMany.mockResolvedValue(resultado);
  return builder as unknown as SelectQueryBuilder<Viaje>;
}
