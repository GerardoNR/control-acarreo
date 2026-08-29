import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Role } from '../auth/enums/role.enum';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { TipoUbicacion, Ubicacion } from '../ubicaciones/ubicacion.entity';
import { RegistrarSalidaViajeDto } from './dto/registrar-salida-viaje.dto';
import { EstadoViaje } from './enums/estado-viaje.enum';
import { Viaje } from './viaje.entity';
import { ViajesService } from './viajes.service';
import { SuspensionesService } from '../suspensiones/suspensiones.service';
import { TipoEntidadSuspension } from '../suspensiones/suspension.entity';
import { TicketsService } from '../tickets/tickets.service';
import { Ticket } from '../tickets/ticket.entity';
import {
  EstadoOrdenAcarreo,
  OrdenAcarreo,
} from '../ordenes-acarreo/orden-acarreo.entity';
import { RutaAcarreo } from '../rutas-acarreo/ruta-acarreo.entity';
import { Tarifa, TipoCobroTarifa } from '../tarifas/tarifa.entity';
import { UnidadControl } from '../unidades-control/unidad-control.entity';
import { TipoIncidenciaViaje } from '../incidencias-viaje/incidencia-viaje.entity';

describe('ViajesService - registrar salida', () => {
  let service: ViajesService;
  let manager: {
    findOneBy: jest.Mock;
    findOne: jest.Mock;
    query: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOneOrFail: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let validarDisponible: jest.Mock;
  let crearTicket: jest.Mock;
  let registrarIncidencias: jest.Mock;
  let viajeGuardado: Viaje | null;

  let proyecto: Proyecto;
  let material: Material;
  let camion: Camion;
  let chofer: Chofer;
  let origen: Ubicacion;
  let destino: Ubicacion;
  let checador: Checador;
  let viajeActivo: Viaje | null;

  const dto: RegistrarSalidaViajeDto = {
    proyecto_id: 1,
    material_id: 2,
    camion_id: 3,
    chofer_id: 4,
    ubicacion_origen_id: 5,
    ubicacion_destino_id: 6,
    cantidad_salida: 14.5,
    observaciones_salida: 'Carga revisada',
  };
  const usuario: AuthUser = {
    id: 7,
    nombre: 'Checador Uno',
    usuario: 'checador1',
    rol: Role.CHECADOR,
  };

  beforeEach(() => {
    proyecto = { id: 1, nombre: 'Proyecto', activo: true } as Proyecto;
    material = {
      id: 2,
      nombre: 'Arena',
      activo: true,
      unidad_medida: 'm3',
    } as Material;
    camion = {
      id: 3,
      activo: true,
      placas: 'ABC-123',
      numero_economico: 'ECO-001',
      nfc_tag_uid: '04:A8:35:7B:92:61:80',
      capacidad_m3: '20.00',
      codigo_ticket_unidad: '23714',
    } as Camion;
    chofer = {
      id: 4,
      nombre: 'Juan',
      apellido_paterno: 'Pérez',
      apellido_materno: null,
      activo: true,
      vigencia_licencia: '2999-12-31',
      deleted_at: null,
    } as Chofer;
    origen = {
      id: 5,
      nombre: 'Banco',
      activo: true,
      tipo: TipoUbicacion.BANCO,
      proyecto,
    } as Ubicacion;
    destino = {
      id: 6,
      nombre: 'Frente',
      activo: true,
      tipo: TipoUbicacion.FRENTE,
      proyecto,
    } as Ubicacion;
    checador = {
      id: 7,
      activo: true,
      nombre: 'Checador Uno',
      usuario: 'checador1',
    } as Checador;
    viajeActivo = null;
    viajeGuardado = null;

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    manager = {
      findOneBy: jest.fn((entity: unknown) => {
        if (entity === Proyecto) return Promise.resolve(proyecto);
        if (entity === Material) return Promise.resolve(material);
        if (entity === Camion) return Promise.resolve(camion);
        if (entity === Chofer) return Promise.resolve(chofer);
        if (entity === Checador) return Promise.resolve(checador);
        return Promise.resolve(null);
      }),
      findOne: jest.fn(
        (entity: unknown, options: { where: { id?: number } }) => {
          if (entity === Ubicacion) {
            return Promise.resolve(
              options.where.id === origen.id ? origen : destino,
            );
          }
          if (entity === Viaje) return Promise.resolve(viajeActivo);
          return Promise.resolve(null);
        },
      ),
      query: jest.fn().mockResolvedValue([{ consecutivo: '42' }]),
      create: jest.fn((_entity: unknown, datos: Partial<Viaje>) => datos),
      save: jest.fn((_entity: unknown, viaje: Viaje) => {
        viajeGuardado = {
          ...viaje,
          id: '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
        };
        return Promise.resolve(viajeGuardado);
      }),
      findOneOrFail: jest.fn(() => Promise.resolve(viajeGuardado)),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    dataSource = {
      transaction: jest.fn((callback: (value: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
      ),
    };
    validarDisponible = jest.fn().mockResolvedValue(undefined);
    crearTicket = jest.fn(() => {
      if (!viajeGuardado) throw new Error('Viaje no guardado');
      viajeGuardado.ticket = {
        id: 'ticket-id',
        codigo_ticket: '260828237140915421537',
        fecha_generacion: viajeGuardado.fecha_hora_salida,
      } as Ticket;
      return Promise.resolve(viajeGuardado.ticket);
    });
    registrarIncidencias = jest.fn().mockResolvedValue(undefined);
    service = new ViajesService(
      dataSource as unknown as DataSource,
      { validarDisponible } as unknown as SuspensionesService,
      { crearParaViaje: crearTicket } as unknown as TicketsService,
      {
        registrarAutomaticas: registrarIncidencias,
      },
    );
  });

  it('1. registra correctamente la salida dentro de una transacción', async () => {
    const resultado = await service.registrarSalida(dto, usuario);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledTimes(1);
    expect(resultado.id).toBe('13a8a44c-9f8e-4f5e-b822-c1972ba1cb85');
    expect(resultado.folio).toMatch(/^VIA-\d{8}-000042$/);
    expect(resultado.ticket?.codigo_ticket).toBe('260828237140915421537');
    expect(crearTicket).toHaveBeenCalledWith(
      manager,
      '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
      '23714',
      expect.any(Date),
    );
    expect(resultado).toEqual(
      expect.objectContaining({
        estado: EstadoViaje.EN_TRANSITO,
        proyecto: { id: 1, nombre: 'Proyecto' },
        material: { id: 2, nombre: 'Arena', unidad_medida: 'm3' },
        cantidad_salida: '14.5',
        unidad_medida: 'm3',
        observaciones_salida: 'Carga revisada',
      }),
    );
    expect(resultado.camion).toMatchObject({ id: 3, placas: 'ABC-123' });
    expect(resultado.chofer).toMatchObject({ id: 4, nombre: 'Juan' });
    expect(resultado.ubicacion_origen).toMatchObject({
      id: 5,
      nombre: 'Banco',
    });
    expect(resultado.ubicacion_destino).toMatchObject({
      id: 6,
      nombre: 'Frente',
    });
    expect(resultado).not.toHaveProperty('cantidad_m3');
    expect(resultado).not.toHaveProperty('folio_banco');
    expect(resultado).not.toHaveProperty('checador_origen');
    expect(resultado).not.toHaveProperty('sincronizado');
    expect(registrarIncidencias).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ id: resultado.id }),
      expect.arrayContaining([
        expect.objectContaining({
          tipo: TipoIncidenciaViaje.RUTA_NO_CONFIGURADA,
        }),
        expect.objectContaining({
          tipo: TipoIncidenciaViaje.TARIFA_NO_CONFIGURADA,
        }),
      ]),
    );
  });

  it.each([
    [TipoEntidadSuspension.CAMION, 'El camión está suspendido temporalmente'],
    [TipoEntidadSuspension.CHOFER, 'El chofer está suspendido temporalmente'],
    [
      TipoEntidadSuspension.UBICACION,
      'La ubicación de origen está suspendida temporalmente',
    ],
  ])('rechaza una salida con %s suspendido', async (tipo, mensaje) => {
    validarDisponible.mockImplementation((actual: TipoEntidadSuspension) =>
      actual === tipo
        ? Promise.reject(new ConflictException(mensaje))
        : Promise.resolve(),
    );
    await expect(service.registrarSalida(dto, usuario)).rejects.toThrow(
      mensaje,
    );
  });

  it('2. rechaza origen y destino iguales antes de abrir la transacción', async () => {
    await expect(
      service.registrarSalida(
        { ...dto, ubicacion_destino_id: dto.ubicacion_origen_id },
        usuario,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it.each([
    [Proyecto, 'proyecto', NotFoundException],
    [Material, 'material', NotFoundException],
    [Camion, 'camión', NotFoundException],
    [Chofer, 'chofer', NotFoundException],
  ])('rechaza %s inexistente', async (entity, _nombre, exception) => {
    manager.findOneBy.mockImplementation((actual: unknown) => {
      if (actual === entity) return Promise.resolve(null);
      if (actual === Proyecto) return Promise.resolve(proyecto);
      if (actual === Material) return Promise.resolve(material);
      if (actual === Camion) return Promise.resolve(camion);
      if (actual === Chofer) return Promise.resolve(chofer);
      if (actual === Checador) return Promise.resolve(checador);
      return Promise.resolve(null);
    });

    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      exception,
    );
  });

  it('7. rechaza un origen inexistente', async () => {
    manager.findOne.mockImplementation(
      (entity: unknown, options: { where: { id?: number } }) => {
        if (entity === Ubicacion && options.where.id === origen.id)
          return Promise.resolve(null);
        if (entity === Ubicacion) return Promise.resolve(destino);
        return Promise.resolve(null);
      },
    );
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('8. rechaza un destino inexistente', async () => {
    manager.findOne.mockImplementation(
      (entity: unknown, options: { where: { id?: number } }) => {
        if (entity === Ubicacion && options.where.id === destino.id)
          return Promise.resolve(null);
        if (entity === Ubicacion) return Promise.resolve(origen);
        return Promise.resolve(null);
      },
    );
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('9. rechaza un checador autenticado inexistente', async () => {
    manager.findOneBy.mockImplementation((entity: unknown) => {
      if (entity === Proyecto) return Promise.resolve(proyecto);
      if (entity === Material) return Promise.resolve(material);
      if (entity === Camion) return Promise.resolve(camion);
      if (entity === Chofer) return Promise.resolve(chofer);
      if (entity === Checador) return Promise.resolve(null);
      return Promise.resolve(null);
    });
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('9. rechaza si el usuario del JWT ya no corresponde al checador', async () => {
    checador.usuario = 'usuario-modificado';
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it.each([
    ['proyecto', () => (proyecto.activo = false)],
    ['material', () => (material.activo = false)],
    ['camión', () => (camion.activo = false)],
    ['chofer', () => (chofer.activo = false)],
    ['origen', () => (origen.activo = false)],
    ['destino', () => (destino.activo = false)],
  ])('10. rechaza %s inactivo', async (_nombre, desactivar) => {
    desactivar();
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('10. rechaza un checador inactivo', async () => {
    checador.activo = false;
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza un chofer con licencia vencida con un mensaje claro', async () => {
    chofer.vigencia_licencia = '2000-01-01';
    await expect(service.registrarSalida(dto, usuario)).rejects.toThrow(
      'La licencia del chofer está vencida. Debe renovarse antes de asignarlo a un nuevo viaje.',
    );
  });

  it('permite un chofer con licencia por vencer', async () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    chofer.vigencia_licencia = manana.toISOString().slice(0, 10);
    await expect(service.registrarSalida(dto, usuario)).resolves.toBeDefined();
  });

  it('11. rechaza ubicaciones que no pertenecen al proyecto', async () => {
    destino.proyecto = { id: 99 } as Proyecto;
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('12. permite Frente → Banco', async () => {
    origen.tipo = TipoUbicacion.FRENTE;
    destino.tipo = TipoUbicacion.BANCO;

    await expect(service.registrarSalida(dto, usuario)).resolves.toMatchObject({
      ubicacion_origen: { tipo: TipoUbicacion.FRENTE },
      ubicacion_destino: { tipo: TipoUbicacion.BANCO },
    });
  });

  it('13. permite ubicaciones del mismo tipo si son puntos diferentes', async () => {
    destino.tipo = TipoUbicacion.BANCO;
    await expect(service.registrarSalida(dto, usuario)).resolves.toBeDefined();
  });

  it('14. permite Traza → Traza', async () => {
    origen.tipo = TipoUbicacion.TRAZA;
    destino.tipo = TipoUbicacion.TRAZA;
    await expect(service.registrarSalida(dto, usuario)).resolves.toMatchObject({
      ubicacion_origen: { tipo: TipoUbicacion.TRAZA },
      ubicacion_destino: { tipo: TipoUbicacion.TRAZA },
    });
  });

  it('15. permite Producto de corte con m3 en Frente → Banco', async () => {
    material.nombre = 'Producto de corte';
    origen.tipo = TipoUbicacion.FRENTE;
    destino.tipo = TipoUbicacion.BANCO;

    await expect(service.registrarSalida(dto, usuario)).resolves.toMatchObject({
      material: {
        nombre: 'Producto de corte',
        unidad_medida: 'm3',
      },
      ubicacion_origen: { tipo: TipoUbicacion.FRENTE },
      ubicacion_destino: { tipo: TipoUbicacion.BANCO },
    });
  });

  it('16. rechaza un material sin unidad válida', async () => {
    material.unidad_medida = '   ';
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('15. rechaza un camión con viaje en tránsito', async () => {
    viajeActivo = { id: 'viaje-activo' } as Viaje;
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(manager.query).not.toHaveBeenCalled();
  });

  it('16. rechaza cantidad superior a capacidad cuando la unidad es m3', async () => {
    await expect(
      service.registrarSalida({ ...dto, cantidad_salida: 20.001 }, usuario),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no compara capacidad cuando la unidad no es compatible', async () => {
    material.unidad_medida = 'toneladas';
    await expect(
      service.registrarSalida({ ...dto, cantidad_salida: 100 }, usuario),
    ).resolves.toBeInstanceOf(Object);
  });

  it('17-21. copia unidad y checador, inicializa estado/campos y consume la secuencia', async () => {
    material.unidad_medida = '  m³  ';
    await service.registrarSalida(dto, usuario);

    expect(manager.query).toHaveBeenCalledWith(
      "SELECT nextval('viajes_folio_seq') AS consecutivo",
    );
    expect(manager.create).toHaveBeenCalledWith(
      Viaje,
      expect.objectContaining({
        unidad_medida: 'm³',
        checador_salida: checador,
        estado: EstadoViaje.EN_TRANSITO,
        cantidad_salida: '14.5',
        cantidad_llegada: null,
        checador_llegada: null,
        fecha_hora_llegada: null,
        administrador_cancelacion: null,
        fecha_hora_cancelacion: null,
        motivo_cancelacion: null,
        observaciones_llegada: null,
      }),
    );
  });

  it('22. convierte la violación concurrente del índice parcial en 409', async () => {
    manager.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate key'), {
          code: '23505',
          constraint: 'UQ_viajes_camion_en_transito',
        }),
      ),
    );
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('23. no convierte otro error de base de datos en 409', async () => {
    const error = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate key'), {
        code: '23505',
        constraint: 'UQ_otra_restriccion',
      }),
    );
    manager.save.mockRejectedValue(error);
    await expect(service.registrarSalida(dto, usuario)).rejects.toBe(error);
  });

  it('24. rechaza defensivamente a un administrador', async () => {
    await expect(
      service.registrarSalida(dto, { ...usuario, rol: Role.ADMINISTRADOR }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('revierte la operación si no puede crear el ticket', async () => {
    crearTicket.mockRejectedValue(new Error('fallo de ticket'));

    await expect(service.registrarSalida(dto, usuario)).rejects.toThrow(
      'fallo de ticket',
    );
    expect(registrarIncidencias).not.toHaveBeenCalled();
  });

  it('rechaza claramente un camión sin código de ticket', async () => {
    camion.codigo_ticket_unidad = null;

    await expect(service.registrarSalida(dto, usuario)).rejects.toThrow(
      'El camión no tiene configurado su código de ticket.',
    );
    expect(manager.save).not.toHaveBeenCalled();
    expect(crearTicket).not.toHaveBeenCalled();
  });

  it('hereda orden, ruta y tarifa, y congela el cálculo económico', async () => {
    camion.capacidad_m3 = '15.600';
    const ruta = {
      id: 20,
      activo: true,
      vigente_desde: '2026-01-01',
      vigente_hasta: null,
      descripcion: 'Ruta acordada 3.5 km',
      distancia_pavimento: '3.500',
      distancia_total: '3.500',
    } as RutaAcarreo;
    const tarifa = {
      id: 21,
      activo: true,
      vigente_desde: '2026-01-01',
      vigente_hasta: null,
      tipo_cobro: TipoCobroTarifa.POR_DISTANCIA_ESCALONADA,
      precio_unitario: null,
      precio_primer_km: '12.0000',
      precio_km_subsecuente: '5.4000',
    } as Tarifa;
    const unidad = {
      id: 22,
      nombre: 'Unidad de prueba',
      activo: true,
      proyecto,
    } as UnidadControl;
    const orden = {
      id: 23,
      folio: 'ORD-20260828-000001',
      estado: EstadoOrdenAcarreo.EN_PROCESO,
      proyecto,
      material,
      ubicacion_origen: origen,
      ubicacion_destino: destino,
      ruta_acarreo: ruta,
      unidad_control: unidad,
      tarifa,
    } as OrdenAcarreo;
    manager.findOne.mockImplementation(
      (entity: unknown, options: { where: { id?: number } }) => {
        if (entity === OrdenAcarreo) return Promise.resolve(orden);
        if (entity === Ubicacion)
          return Promise.resolve(
            options.where.id === origen.id ? origen : destino,
          );
        if (entity === Viaje) return Promise.resolve(null);
        return Promise.resolve(null);
      },
    );

    await service.registrarSalida(
      {
        orden_acarreo_id: orden.id,
        camion_id: camion.id,
        chofer_id: chofer.id,
        cantidad_salida: 15.6,
      },
      usuario,
    );

    expect(manager.create).toHaveBeenCalledWith(
      Viaje,
      expect.objectContaining({
        orden_acarreo: orden,
        ruta_acarreo: ruta,
        tarifa_aplicada: tarifa,
        unidad_control: unidad,
        capacidad_aplicada_m3: '15.600',
        distancia_total_aplicada: '3.500',
        precio_primer_km_aplicado: '12.0000',
        precio_km_subsecuente_aplicado: '5.4000',
        m3_km: '54.60',
        coste_primer_km: '187.20',
        coste_km_subsecuente: '210.60',
        importe_acarreo: '397.80',
      }),
    );
    expect(registrarIncidencias).toHaveBeenCalledWith(
      manager,
      expect.any(Object),
      [],
    );
  });
});
