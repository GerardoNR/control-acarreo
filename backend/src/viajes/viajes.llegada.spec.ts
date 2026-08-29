import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Role } from '../auth/enums/role.enum';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { TipoUbicacion, Ubicacion } from '../ubicaciones/ubicacion.entity';
import { EstadoViaje } from './enums/estado-viaje.enum';
import { Viaje } from './viaje.entity';
import { ViajesService } from './viajes.service';
import { TipoIncidenciaViaje } from '../incidencias-viaje/incidencia-viaje.entity';
import { SuspensionesService } from '../suspensiones/suspensiones.service';
import { TicketsService } from '../tickets/tickets.service';
import { UnidadControl } from '../unidades-control/unidad-control.entity';

describe('ViajesService - registrar llegada', () => {
  const id = '9f7538fb-d306-42f7-a010-8865668c57b8';
  const usuario: AuthUser = {
    id: 7,
    nombre: 'Checador llegada',
    usuario: 'checador.llegada',
    rol: Role.CHECADOR,
  };
  let service: ViajesService;
  let viaje: Viaje | null;
  let checadorLlegada: Checador | null;
  let manager: {
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let registrarIncidencias: jest.Mock;
  let incidenciasRegistradas: Array<{ tipo: TipoIncidenciaViaje }>;

  beforeEach(() => {
    const checadorSalida = {
      id: 6,
      nombre: 'Checador salida',
      password_hash: 'no-debe-salir',
    } as Checador;
    checadorLlegada = {
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      activo: true,
      password_hash: 'tampoco-debe-salir',
    } as Checador;
    viaje = {
      id,
      id_legacy: null,
      folio: 'VIA-20260812-000001',
      proyecto: { id: 1, nombre: 'Proyecto' } as Proyecto,
      material: {
        id: 2,
        nombre: 'Material',
        unidad_medida: 'm3',
        activo: true,
      } as Material,
      camion: {
        id: 3,
        placas: 'ABC-123',
        numero_economico: 'ECO-001',
        nfc_tag_uid: '04:A8:35:7B:92:61:80',
      } as Camion,
      chofer: {
        id: 4,
        nombre: 'Chofer',
        apellido_paterno: 'Uno',
        apellido_materno: null,
      } as Chofer,
      ubicacion_origen: {
        id: 5,
        nombre: 'Banco',
        tipo: TipoUbicacion.BANCO,
      } as Ubicacion,
      ubicacion_destino: {
        id: 8,
        nombre: 'Frente',
        tipo: TipoUbicacion.FRENTE,
        activo: true,
        proyecto: { id: 1 } as Proyecto,
      } as Ubicacion,
      checador_salida: checadorSalida,
      checador_llegada: null,
      administrador_cancelacion: null as Administrador | null,
      cantidad_salida: '14.500',
      cantidad_llegada: null,
      unidad_medida: 'm3',
      fecha_hora_salida: new Date('2026-08-12T18:00:00.000Z'),
      fecha_hora_llegada: null,
      fecha_hora_cancelacion: null,
      estado: EstadoViaje.EN_TRANSITO,
      observaciones_salida: 'Salida original',
      observaciones_llegada: null,
      motivo_cancelacion: null,
      unidad_control: null,
      unidad_control_nombre_snapshot: null,
      creado_en: new Date('2026-08-12T18:00:00.000Z'),
      actualizado_en: new Date('2026-08-12T18:00:00.000Z'),
    } as Viaje;
    manager = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(viaje)),
      findOneBy: jest
        .fn()
        .mockImplementation(() => Promise.resolve(checadorLlegada)),
      findOneOrFail: jest.fn().mockImplementation(() => Promise.resolve(viaje)),
      save: jest
        .fn()
        .mockImplementation((_entity: unknown, entity: Viaje) =>
          Promise.resolve(entity),
        ),
    };
    dataSource = {
      transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
      ),
    };
    incidenciasRegistradas = [];
    registrarIncidencias = jest.fn(
      (
        _manager: EntityManager,
        _viaje: Viaje,
        incidencias: Array<{ tipo: TipoIncidenciaViaje }>,
      ) => {
        incidenciasRegistradas = incidencias;
        return Promise.resolve();
      },
    );
    service = new ViajesService(
      dataSource as unknown as DataSource,
      { validarDisponible: jest.fn() } as unknown as SuspensionesService,
      {} as TicketsService,
      {
        registrarAutomaticas: registrarIncidencias,
      },
    );
  });

  it('registra la llegada, completa el viaje y conserva sus datos originales', async () => {
    const resultado = await service.registrarLlegada(
      id,
      {
        cantidad_llegada: 14.5,
        observaciones_llegada: 'Descarga recibida correctamente',
      },
      usuario,
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(
      Viaje,
      expect.objectContaining({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      Viaje,
      expect.objectContaining({
        id,
        folio: 'VIA-20260812-000001',
        cantidad_llegada: '14.5',
        checador_llegada: checadorLlegada,
        ubicacion_destino_real: viaje?.ubicacion_destino,
        material_llegada: viaje?.material,
        observaciones_llegada: 'Descarga recibida correctamente',
        estado: EstadoViaje.COMPLETADO,
      }),
    );
    expect(resultado.fecha_hora_llegada).toBeInstanceOf(Date);
    expect(resultado.checador_llegada).toEqual({
      id: usuario.id,
      nombre: usuario.nombre,
    });
    expect(JSON.stringify(resultado)).not.toContain('password_hash');
  });

  it('responde 404 cuando el viaje no existe', async () => {
    viaje = null;
    await expect(
      service.registrarLlegada(id, { cantidad_llegada: 14.5 }, usuario),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('es idempotente cuando el viaje ya fue completado', async () => {
    if (!viaje) throw new Error('Viaje de prueba no inicializado');
    viaje.estado = EstadoViaje.COMPLETADO;
    await expect(
      service.registrarLlegada(id, { cantidad_llegada: 14.5 }, usuario),
    ).resolves.toMatchObject({ id, estado: EstadoViaje.COMPLETADO });
    expect(manager.save).not.toHaveBeenCalled();
    expect(registrarIncidencias).not.toHaveBeenCalled();
  });

  it('registra incidencias por destino, material y checador diferentes', async () => {
    if (!viaje || !checadorLlegada) throw new Error('Prueba no inicializada');
    viaje.checador_salida = checadorLlegada;
    const destinoReal = {
      id: 9,
      nombre: 'Otra traza',
      tipo: TipoUbicacion.TRAZA,
      activo: true,
      proyecto: viaje.proyecto,
    } as Ubicacion;
    const materialReal = {
      id: 10,
      nombre: 'Material recibido',
      activo: true,
    } as Material;
    manager.findOne.mockImplementation(
      (entity: unknown, options: { where: { id?: string | number } }) => {
        if (entity === Viaje) return Promise.resolve(viaje);
        if (entity === Ubicacion && options.where.id === destinoReal.id)
          return Promise.resolve(destinoReal);
        return Promise.resolve(null);
      },
    );
    manager.findOneBy.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === Material ? materialReal : checadorLlegada),
    );

    await service.registrarLlegada(
      id,
      {
        ubicacion_destino_real_id: destinoReal.id,
        material_llegada_id: materialReal.id,
        folio_destino: '260827237520805565025',
      },
      usuario,
    );

    expect(incidenciasRegistradas.map(({ tipo }) => tipo)).toEqual([
      TipoIncidenciaViaje.DESTINO_DIFERENTE,
      TipoIncidenciaViaje.MATERIAL_DESTINO_DIFERENTE,
      TipoIncidenciaViaje.MISMO_CHECADOR,
    ]);
    expect(viaje.folio_destino).toBe('260827237520805565025');
  });

  it('confirma la Unidad sugerida y congela su nombre al llegar', async () => {
    if (!viaje) throw new Error('Viaje de prueba no inicializado');
    const unidad = {
      id: 20,
      nombre: 'Unidad sugerida',
      activo: true,
      proyecto: viaje.proyecto,
    } as UnidadControl;
    viaje.unidad_control = unidad;
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === UnidadControl ? unidad : viaje),
    );

    await service.registrarLlegada(
      id,
      { unidad_control_id: unidad.id },
      usuario,
    );

    expect(viaje.unidad_control).toBe(unidad);
    expect(viaje.unidad_control_nombre_snapshot).toBe('Unidad sugerida');
  });

  it('permite seleccionar una Unidad distinta de la sugerida', async () => {
    if (!viaje) throw new Error('Viaje de prueba no inicializado');
    const unidad = {
      id: 21,
      nombre: 'Unidad realmente utilizada',
      activo: true,
      proyecto: viaje.proyecto,
    } as UnidadControl;
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === UnidadControl ? unidad : viaje),
    );

    await service.registrarLlegada(
      id,
      { unidad_control_id: unidad.id },
      usuario,
    );

    expect(viaje.unidad_control).toBe(unidad);
    expect(viaje.unidad_control_nombre_snapshot).toBe(
      'Unidad realmente utilizada',
    );
  });

  it('rechaza una Unidad perteneciente a otro proyecto', async () => {
    if (!viaje) throw new Error('Viaje de prueba no inicializado');
    const unidad = {
      id: 22,
      nombre: 'Unidad ajena',
      activo: true,
      proyecto: { id: 999 } as Proyecto,
    } as UnidadControl;
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === UnidadControl ? unidad : viaje),
    );

    await expect(
      service.registrarLlegada(
        id,
        { unidad_control_id: unidad.id },
        usuario,
      ),
    ).rejects.toThrow('La unidad de control debe pertenecer al proyecto');
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rechaza una Unidad retirada', async () => {
    if (!viaje) throw new Error('Viaje de prueba no inicializado');
    const unidad = {
      id: 23,
      nombre: 'Unidad retirada',
      activo: false,
      proyecto: viaje.proyecto,
    } as UnidadControl;
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === UnidadControl ? unidad : viaje),
    );

    await expect(
      service.registrarLlegada(
        id,
        { unidad_control_id: unidad.id },
        usuario,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rechaza defensivamente a un administrador antes de la transacción', async () => {
    await expect(
      service.registrarLlegada(
        id,
        { cantidad_llegada: 14.5 },
        { ...usuario, rol: Role.ADMINISTRADOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rechaza un checador del JWT que ya no es válido', async () => {
    checadorLlegada = null;
    await expect(
      service.registrarLlegada(id, { cantidad_llegada: 14.5 }, usuario),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(manager.save).not.toHaveBeenCalled();
  });
});
