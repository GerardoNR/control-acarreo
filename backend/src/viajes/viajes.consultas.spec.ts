import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, FindOperator, Repository } from 'typeorm';
import { Camion } from '../camiones/camion.entity';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { TipoUbicacion, Ubicacion } from '../ubicaciones/ubicacion.entity';
import { EstadoViaje } from './enums/estado-viaje.enum';
import { Viaje } from './viaje.entity';
import { ViajesService } from './viajes.service';

describe('ViajesService - consultas', () => {
  let service: ViajesService;
  let viajesRepository: {
    findAndCount: jest.MockedFunction<Repository<Viaje>['findAndCount']>;
    findOne: jest.MockedFunction<Repository<Viaje>['findOne']>;
  };
  let camionesRepository: {
    findOneBy: jest.MockedFunction<Repository<Camion>['findOneBy']>;
  };
  let dataSource: { getRepository: jest.Mock };
  let viaje: Viaje;

  beforeEach(() => {
    const proyecto = { id: 1, nombre: 'Proyecto' } as Proyecto;
    const material = {
      id: 2,
      nombre: 'Material',
      unidad_medida: 'm3',
    } as Material;
    const camion = {
      id: 3,
      placas: 'ABC-123',
      numero_economico: 'ECO-1',
      nfc_tag_uid: '04:A8',
    } as Camion;
    const chofer = {
      id: 4,
      nombre: 'Juan',
      apellido_paterno: 'Pérez',
      apellido_materno: null,
    } as Chofer;
    const origen = {
      id: 5,
      nombre: 'Banco',
      tipo: TipoUbicacion.BANCO,
    } as Ubicacion;
    const destino = {
      id: 6,
      nombre: 'Frente',
      tipo: TipoUbicacion.FRENTE,
    } as Ubicacion;
    const checador = {
      id: 7,
      nombre: 'Checador',
      usuario: 'secreto-usuario',
      password_hash: 'hash-secreto',
    } as Checador;
    const administrador = {
      id: 8,
      nombre: 'Administrador',
      usuario: 'admin-secreto',
      password_hash: 'hash-admin',
    } as Administrador;
    viaje = {
      id: '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
      id_legacy: null,
      folio: 'VIA-20260812-000001',
      proyecto,
      material,
      camion,
      chofer,
      ubicacion_origen: origen,
      ubicacion_destino: destino,
      checador_salida: checador,
      checador_llegada: null,
      administrador_cancelacion: administrador,
      cantidad_salida: '14.500',
      cantidad_llegada: null,
      unidad_medida: 'm3',
      fecha_hora_salida: new Date('2026-08-12T18:00:00.000Z'),
      fecha_hora_llegada: null,
      fecha_hora_cancelacion: null,
      estado: EstadoViaje.EN_TRANSITO,
      observaciones_salida: null,
      observaciones_llegada: null,
      motivo_cancelacion: null,
      creado_en: new Date('2026-08-12T18:00:00.000Z'),
      actualizado_en: new Date('2026-08-12T18:00:00.000Z'),
    } as Viaje;
    viajesRepository = {
      findAndCount: jest
        .fn<Repository<Viaje>['findAndCount']>()
        .mockResolvedValue([[viaje], 21]),
      findOne: jest.fn<Repository<Viaje>['findOne']>().mockResolvedValue(viaje),
    };
    camionesRepository = {
      findOneBy: jest
        .fn<Repository<Camion>['findOneBy']>()
        .mockResolvedValue(camion),
    };
    dataSource = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Viaje ? viajesRepository : camionesRepository,
      ),
    };
    service = new ViajesService(dataSource as unknown as DataSource);
  });

  it('1, 8-10. pagina, ordena y calcula metadatos', async () => {
    const resultado = await service.consultar({ page: 2, limit: 20 });
    expect(viajesRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
        order: { fecha_hora_salida: 'DESC', id: 'DESC' },
      }),
    );
    expect(resultado.meta).toEqual({
      page: 2,
      limit: 20,
      total: 21,
      total_pages: 2,
    });

    viajesRepository.findAndCount.mockResolvedValueOnce([[], 21]);
    await expect(service.consultar({ page: 3, limit: 20 })).resolves.toEqual(
      expect.objectContaining({ data: [] }),
    );
  });

  it.each([
    ['proyecto_id', 'proyecto', 1],
    ['material_id', 'material', 2],
    ['camion_id', 'camion', 3],
    ['chofer_id', 'chofer', 4],
    ['ubicacion_origen_id', 'ubicacion_origen', 5],
    ['ubicacion_destino_id', 'ubicacion_destino', 6],
  ] as const)('2. aplica filtro %s', async (campo, relacion, id) => {
    await service.consultar({ page: 1, limit: 20, [campo]: id });
    const opciones = obtenerOpcionesConsulta();
    expect((opciones.where as Record<string, unknown>)[relacion]).toEqual({
      id,
    });
  });

  it('3. aplica filtro de estado', async () => {
    await service.consultar({
      page: 1,
      limit: 20,
      estado: EstadoViaje.COMPLETADO,
    });
    expect(obtenerOpcionesConsulta().where).toEqual(
      expect.objectContaining({ estado: EstadoViaje.COMPLETADO }),
    );
  });

  it('aplica búsqueda parcial de folio sin distinguir mayúsculas', async () => {
    await service.consultar({
      page: 1,
      limit: 20,
      folio: '20260812-000001',
    });
    const opciones = obtenerOpcionesConsulta();
    const where = opciones.where as { folio: FindOperator<string> };
    expect(where.folio.type).toBe('ilike');
    expect(where.folio.value).toBe('%20260812-000001%');
  });

  it('4. interpreta fecha_desde simple al inicio en Monterrey', async () => {
    await service.consultar({
      page: 1,
      limit: 20,
      fecha_desde: '2026-08-12',
    });
    expect(valorOperadorFecha()).toEqual(new Date('2026-08-12T06:00:00.000Z'));
  });

  it('5. interpreta fecha_hasta simple como inicio exclusivo del día siguiente', async () => {
    await service.consultar({
      page: 1,
      limit: 20,
      fecha_hasta: '2026-08-12',
    });
    expect(valorOperadorFecha()).toEqual(new Date('2026-08-13T06:00:00.000Z'));
  });

  it('6. conserva un timestamp ISO con zona como instante exacto', async () => {
    await service.consultar({
      page: 1,
      limit: 20,
      fecha_desde: '2026-08-12T09:30:00-06:00',
    });
    expect(valorOperadorFecha()).toEqual(new Date('2026-08-12T15:30:00.000Z'));
  });

  it('7. rechaza un rango temporal inválido', async () => {
    await expect(
      service.consultar({
        page: 1,
        limit: 20,
        fecha_desde: '2026-08-13',
        fecha_hasta: '2026-08-12',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida fechas civiles y contempla cambios históricos de horario', async () => {
    await service.consultar({
      page: 1,
      limit: 20,
      fecha_desde: '2021-07-01',
    });
    expect(valorOperadorFecha()).toEqual(new Date('2021-07-01T05:00:00.000Z'));
    await expect(
      service.consultar({
        page: 1,
        limit: 20,
        fecha_desde: '2026-02-30',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('11, 15, 21. proyecta relaciones seguras sin credenciales', async () => {
    const resultado = await service.consultar({ page: 1, limit: 20 });
    expect(resultado.data[0]).toEqual(
      expect.objectContaining({
        proyecto: { id: 1, nombre: 'Proyecto' },
        checador_salida: { id: 7, nombre: 'Checador' },
        administrador_cancelacion: { id: 8, nombre: 'Administrador' },
      }),
    );
    expect(JSON.stringify(resultado)).not.toContain('password_hash');
    expect(JSON.stringify(resultado)).not.toContain('secreto-usuario');
  });

  it('12-13. consulta viaje existente y responde 404 si no existe', async () => {
    await expect(service.consultarPorId(viaje.id)).resolves.toEqual(
      expect.objectContaining({ id: viaje.id }),
    );
    viajesRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.consultarPorId(viaje.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('16, 19. consulta por NFC exacto y viaje en tránsito', async () => {
    await expect(service.consultarActivoPorNfc('04:A8')).resolves.toEqual(
      expect.objectContaining({ id: viaje.id }),
    );
    expect(camionesRepository.findOneBy).toHaveBeenCalledWith({
      nfc_tag_uid: '04:A8',
      activo: true,
    });
    expect(viajesRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { camion: { id: 3 }, estado: EstadoViaje.EN_TRANSITO },
      }),
    );
  });

  it('17. responde 404 para NFC inexistente', async () => {
    camionesRepository.findOneBy.mockResolvedValueOnce(null);
    await expect(
      service.consultarActivoPorNfc('NO-EXISTE'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('18. responde 404 para camión sin viaje activo', async () => {
    viajesRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.consultarActivoPorNfc('04:A8')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  function valorOperadorFecha(): Date {
    const opciones = obtenerOpcionesConsulta();
    const where = opciones.where as { fecha_hora_salida: FindOperator<Date> };
    return where.fecha_hora_salida.value;
  }

  function obtenerOpcionesConsulta() {
    const opciones = viajesRepository.findAndCount.mock.calls[0]?.[0];
    if (!opciones) throw new Error('No se registró la consulta esperada');
    return opciones;
  }
});
