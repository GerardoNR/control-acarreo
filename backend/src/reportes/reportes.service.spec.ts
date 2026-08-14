import { Repository, SelectQueryBuilder } from 'typeorm';
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
});

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
