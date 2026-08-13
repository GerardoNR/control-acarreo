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

describe('ViajesService - registrar salida', () => {
  let service: ViajesService;
  let manager: {
    findOneBy: jest.Mock;
    findOne: jest.Mock;
    query: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

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
    proyecto = { id: 1, activo: true } as Proyecto;
    material = {
      id: 2,
      activo: true,
      unidad_medida: 'm3',
    } as Material;
    camion = { id: 3, activo: true, capacidad_m3: '20.00' } as Camion;
    chofer = { id: 4, activo: true } as Chofer;
    origen = {
      id: 5,
      activo: true,
      tipo: TipoUbicacion.BANCO,
      proyecto,
    } as Ubicacion;
    destino = {
      id: 6,
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
      save: jest.fn((_entity: unknown, viaje: Viaje) =>
        Promise.resolve({
          ...viaje,
          id: '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
        }),
      ),
    };
    dataSource = {
      transaction: jest.fn((callback: (value: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
      ),
    };
    service = new ViajesService(dataSource as unknown as DataSource);
  });

  it('1. registra correctamente la salida dentro de una transacción', async () => {
    const resultado = await service.registrarSalida(dto, usuario);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledTimes(1);
    expect(resultado.id).toBe('13a8a44c-9f8e-4f5e-b822-c1972ba1cb85');
    expect(resultado.folio).toMatch(/^VIA-\d{8}-000042$/);
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

  it('11. rechaza ubicaciones que no pertenecen al proyecto', async () => {
    destino.proyecto = { id: 99 } as Proyecto;
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('12. rechaza un origen que no es banco', async () => {
    origen.tipo = TipoUbicacion.FRENTE;
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('13. rechaza un destino que no es frente', async () => {
    destino.tipo = TipoUbicacion.BANCO;
    await expect(service.registrarSalida(dto, usuario)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('14. rechaza un material sin unidad válida', async () => {
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
});
