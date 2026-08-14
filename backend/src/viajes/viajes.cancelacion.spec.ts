import {
  ConflictException,
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

describe('ViajesService - cancelar', () => {
  const id = '9f7538fb-d306-42f7-a010-8865668c57b8';
  const usuario: AuthUser = {
    id: 8,
    nombre: 'Administrador',
    usuario: 'admin',
    rol: Role.ADMINISTRADOR,
  };
  let service: ViajesService;
  let viaje: Viaje | null;
  let administrador: Administrador | null;
  let manager: {
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(() => {
    administrador = {
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      activo: true,
      password_hash: 'hash-no-visible',
    } as Administrador;
    viaje = {
      id,
      id_legacy: null,
      folio: 'VIA-20260812-000001',
      proyecto: { id: 1, nombre: 'Proyecto' } as Proyecto,
      material: {
        id: 2,
        nombre: 'Material',
        unidad_medida: 'm3',
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
        id: 6,
        nombre: 'Frente',
        tipo: TipoUbicacion.FRENTE,
      } as Ubicacion,
      checador_salida: {
        id: 7,
        nombre: 'Checador salida',
        password_hash: 'hash-checador',
      } as Checador,
      checador_llegada: null,
      administrador_cancelacion: null,
      cantidad_salida: '14.500',
      cantidad_llegada: null,
      unidad_medida: 'm3',
      fecha_hora_salida: new Date('2026-08-12T18:00:00.000Z'),
      fecha_hora_llegada: null,
      fecha_hora_cancelacion: null,
      estado: EstadoViaje.EN_TRANSITO,
      observaciones_salida: 'Salida intacta',
      observaciones_llegada: null,
      motivo_cancelacion: null,
      creado_en: new Date('2026-08-12T18:00:00.000Z'),
      actualizado_en: new Date('2026-08-12T18:00:00.000Z'),
    } as Viaje;
    manager = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(viaje)),
      findOneBy: jest
        .fn()
        .mockImplementation(() => Promise.resolve(administrador)),
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
    service = new ViajesService(dataSource as unknown as DataSource);
  });

  it('cancela el viaje, conserva la salida y devuelve una respuesta segura', async () => {
    const resultado = await service.cancelar(
      id,
      { motivo_cancelacion: 'Cambio de frente' },
      usuario,
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(Viaje, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.save).toHaveBeenCalledWith(
      Viaje,
      expect.objectContaining({
        id,
        folio: 'VIA-20260812-000001',
        cantidad_salida: '14.500',
        observaciones_salida: 'Salida intacta',
        cantidad_llegada: null,
        fecha_hora_llegada: null,
        estado: EstadoViaje.CANCELADO,
        administrador_cancelacion: administrador,
        motivo_cancelacion: 'Cambio de frente',
      }),
    );
    expect(resultado.fecha_hora_cancelacion).toBeInstanceOf(Date);
    expect(resultado.administrador_cancelacion).toEqual({
      id: usuario.id,
      nombre: usuario.nombre,
    });
    expect(JSON.stringify(resultado)).not.toContain('password_hash');
  });

  it('responde 404 cuando el viaje no existe', async () => {
    viaje = null;
    await expect(
      service.cancelar(id, { motivo_cancelacion: 'Cambio de frente' }, usuario),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it.each([EstadoViaje.CANCELADO, EstadoViaje.COMPLETADO])(
    'responde 409 cuando el viaje está %s',
    async (estado) => {
      if (!viaje) throw new Error('Viaje de prueba no inicializado');
      viaje.estado = estado;
      await expect(
        service.cancelar(
          id,
          { motivo_cancelacion: 'Cambio de frente' },
          usuario,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
    },
  );

  it('rechaza defensivamente a un checador antes de la transacción', async () => {
    await expect(
      service.cancelar(
        id,
        { motivo_cancelacion: 'Cambio de frente' },
        { ...usuario, rol: Role.CHECADOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rechaza un administrador del JWT que ya no es válido', async () => {
    administrador = null;
    await expect(
      service.cancelar(id, { motivo_cancelacion: 'Cambio de frente' }, usuario),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('usa el mismo bloqueo que llegada para serializar estados terminales', async () => {
    await service.cancelar(
      id,
      { motivo_cancelacion: 'Cambio de frente' },
      usuario,
    );
    expect(manager.findOne).toHaveBeenCalledWith(
      Viaje,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });
});
