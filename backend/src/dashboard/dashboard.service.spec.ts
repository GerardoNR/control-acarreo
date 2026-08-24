import { Repository, SelectQueryBuilder } from 'typeorm';
import { EstadoViaje } from '../viajes/enums/estado-viaje.enum';
import { Viaje } from '../viajes/viaje.entity';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('calcula conteos y volumen diario agrupado por unidad', async () => {
    const conteos = crearQueryBuilder({
      viajes_hoy: '8',
      en_transito: '3',
      completados_hoy: '4',
      cancelados_hoy: '1',
    });
    const volumenes = crearQueryBuilder([
      { unidad_medida: 'm3', cantidad: '52.750' },
      { unidad_medida: 'ton', cantidad: '18.000' },
    ]);
    const repository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(conteos.builder)
        .mockReturnValueOnce(volumenes.builder),
    } as unknown as Repository<Viaje>;

    const resultado = await new DashboardService(repository).resumen(
      new Date('2026-08-25T04:00:00.000Z'),
    );

    expect(resultado).toEqual({
      fecha_operativa: '2026-08-24',
      zona_horaria: 'America/Monterrey',
      viajes_hoy: 8,
      en_transito: 3,
      completados_hoy: 4,
      cancelados_hoy: 1,
      volumen_transportado: [
        { unidad_medida: 'm3', cantidad: 52.75 },
        { unidad_medida: 'ton', cantidad: 18 },
      ],
    });
    expect(conteos.setParameters).toHaveBeenCalledWith({
      inicio: new Date('2026-08-24T06:00:00.000Z'),
      fin: new Date('2026-08-25T06:00:00.000Z'),
      enTransito: EstadoViaje.EN_TRANSITO,
      completado: EstadoViaje.COMPLETADO,
      cancelado: EstadoViaje.CANCELADO,
    });
    expect(volumenes.where).toHaveBeenCalledWith('viaje.estado = :completado', {
      completado: EstadoViaje.COMPLETADO,
    });
    expect(volumenes.andWhere).toHaveBeenCalledWith(
      'viaje.fecha_hora_llegada >= :inicio',
      { inicio: new Date('2026-08-24T06:00:00.000Z') },
    );
    expect(volumenes.andWhere).toHaveBeenCalledWith(
      'viaje.fecha_hora_llegada < :fin',
      { fin: new Date('2026-08-25T06:00:00.000Z') },
    );
    expect(volumenes.groupBy).toHaveBeenCalledWith('viaje.unidad_medida');
  });

  it('devuelve ceros y una lista de volumen vacía sin viajes', async () => {
    const conteos = crearQueryBuilder({
      viajes_hoy: '0',
      en_transito: '0',
      completados_hoy: '0',
      cancelados_hoy: '0',
    });
    const volumenes = crearQueryBuilder([]);
    const repository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(conteos.builder)
        .mockReturnValueOnce(volumenes.builder),
    } as unknown as Repository<Viaje>;

    await expect(
      new DashboardService(repository).resumen(
        new Date('2026-08-24T18:00:00.000Z'),
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        viajes_hoy: 0,
        en_transito: 0,
        completados_hoy: 0,
        cancelados_hoy: 0,
        volumen_transportado: [],
      }),
    );
  });
});

function crearQueryBuilder(resultado: unknown) {
  const builder = {
    select: jest.fn(),
    addSelect: jest.fn(),
    setParameters: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    groupBy: jest.fn(),
    orderBy: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };
  for (const metodo of [
    'select',
    'addSelect',
    'setParameters',
    'where',
    'andWhere',
    'groupBy',
    'orderBy',
  ] as const) {
    builder[metodo].mockReturnValue(builder);
  }
  builder.getRawOne.mockResolvedValue(resultado);
  builder.getRawMany.mockResolvedValue(resultado);
  return {
    builder: builder as unknown as SelectQueryBuilder<Viaje>,
    ...builder,
  };
}
