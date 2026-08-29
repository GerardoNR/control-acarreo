import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Role } from '../auth/enums/role.enum';
import { Camion } from '../camiones/camion.entity';
import { Checador } from '../checadores/checador.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { Viaje } from '../viajes/viaje.entity';
import { OrdenAcarreo } from '../ordenes-acarreo/orden-acarreo.entity';
import { Tarifa } from '../tarifas/tarifa.entity';
import { Estimacion } from '../estimaciones/estimacion.entity';
import { PapeleraService } from './papelera.service';
import { SuspensionesService } from '../suspensiones/suspensiones.service';

describe('PapeleraService', () => {
  const usuario = {
    id: 1,
    nombre: 'Administrador',
    usuario: 'admin',
    rol: Role.ADMINISTRADOR,
  };
  let entidad: Checador;
  let repositorio: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let viajesCount: number;
  let auditoria: { registrar: jest.Mock };
  let suspensiones: { finalizarPorPapelera: jest.Mock };
  let service: PapeleraService;

  beforeEach(() => {
    entidad = {
      id: 10,
      nombre: 'Checador Uno',
      activo: true,
      deleted_at: null,
      activo_antes_papelera: null,
    } as Checador;
    repositorio = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(entidad),
      save: jest.fn((value) => Promise.resolve(value)),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn(() => Promise.resolve(viajesCount)),
      })),
    };
    viajesCount = 0;
    auditoria = { registrar: jest.fn().mockResolvedValue({}) };
    suspensiones = {
      finalizarPorPapelera: jest.fn().mockResolvedValue(undefined),
    };
    const viajeRepository = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn(() => Promise.resolve(viajesCount)),
      })),
    };
    const dataSource = {
      getRepository: jest.fn((target: unknown) =>
        target === Viaje ? viajeRepository : repositorio,
      ),
    };
    service = new PapeleraService(
      dataSource as unknown as DataSource,
      auditoria as unknown as AuditoriaService,
      suspensiones as unknown as SuspensionesService,
    );
  });

  it('mantiene disponible la aplicación si falla la depuración programada', async () => {
    const errorLog = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    jest
      .spyOn(service, 'depurarVencidos')
      .mockRejectedValueOnce(new Error('Esquema pendiente'));

    service.onModuleInit();
    await new Promise<void>((resolve) => setImmediate(resolve));
    service.onModuleDestroy();

    expect(errorLog).toHaveBeenCalledWith(
      'No fue posible depurar la Papelera: Esquema pendiente',
    );
    errorLog.mockRestore();
  });

  it('envía a Papelera, guarda el estado anterior y registra auditoría', async () => {
    const item = await service.enviar('checador', entidad.id, usuario);

    expect(entidad.activo).toBe(false);
    expect(entidad.activo_antes_papelera).toBe(true);
    expect(entidad.deleted_at).toBeInstanceOf(Date);
    expect(item.delete_after.getTime() - item.deleted_at.getTime()).toBe(
      30 * 24 * 60 * 60 * 1000,
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'ENVIAR_PAPELERA_CHECADOR' }),
    );
  });

  it('restaura el estado activo que existía antes de Papelera', async () => {
    entidad.activo = false;
    entidad.activo_antes_papelera = true;
    entidad.deleted_at = new Date();

    await service.restaurar('checador', entidad.id, usuario);

    expect(entidad).toMatchObject({
      activo: true,
      activo_antes_papelera: null,
      deleted_at: null,
    });
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'RESTAURAR_CHECADOR' }),
    );
  });

  it('mantiene restaurable un registro con menos de treinta días', async () => {
    entidad.deleted_at = new Date();
    repositorio.find.mockResolvedValueOnce([entidad]).mockResolvedValue([]);

    await service.depurarVencidos();

    expect(repositorio.remove).not.toHaveBeenCalled();
    expect(entidad.deleted_at).not.toBeNull();
  });

  it('procesa como baja un registro vencido con historial', async () => {
    entidad.deleted_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    repositorio.find.mockResolvedValueOnce([entidad]).mockResolvedValue([]);
    viajesCount = 1;

    await service.depurarVencidos();

    expect(repositorio.remove).not.toHaveBeenCalled();
    expect(entidad).toMatchObject({ activo: false, deleted_at: null });
  });

  it('elimina físicamente un registro vencido sin historial', async () => {
    entidad.deleted_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    repositorio.find.mockResolvedValueOnce([entidad]).mockResolvedValue([]);

    await service.depurarVencidos();

    expect(repositorio.remove).toHaveBeenCalledWith(entidad);
  });

  it('depuración conserva como baja un registro vencido con historial', async () => {
    entidad.deleted_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    repositorio.find.mockResolvedValueOnce([entidad]).mockResolvedValue([]);
    viajesCount = 1;

    await service.depurarVencidos();

    expect(entidad).toMatchObject({ activo: false, deleted_at: null });
    expect(repositorio.remove).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'CONSERVAR_COMO_BAJA_CHECADOR' }),
    );
  });

  it('no procesa un registro que fue restaurado', async () => {
    entidad.deleted_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await service.restaurar('checador', entidad.id, usuario);
    repositorio.find.mockResolvedValueOnce([entidad]).mockResolvedValue([]);

    await service.depurarVencidos();

    expect(repositorio.remove).not.toHaveBeenCalled();
  });

  it('continúa con los demás registros cuando uno falla', async () => {
    const fallido = { ...entidad, id: 11, deleted_at: new Date(0) } as Checador;
    const valido = { ...entidad, id: 12, deleted_at: new Date(0) } as Checador;
    repositorio.find
      .mockResolvedValueOnce([fallido, valido])
      .mockResolvedValue([]);
    repositorio.remove
      .mockRejectedValueOnce(new Error('FK RESTRICT'))
      .mockResolvedValueOnce(undefined);
    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await service.depurarVencidos();

    expect(repositorio.remove).toHaveBeenCalledTimes(2);
    expect(errorLog).toHaveBeenCalledWith(
      'No fue posible procesar checador 11: FK RESTRICT',
    );
    errorLog.mockRestore();
  });

  it('acepta todos los tipos configurados de Papelera', async () => {
    for (const [tipo, target] of [
      ['checador', Checador],
      ['chofer', Chofer],
      ['camion', Camion],
      ['material', Material],
      ['ubicacion', Ubicacion],
      ['proyecto', Proyecto],
    ] as const) {
      expect(target).toBeDefined();
      entidad.deleted_at = null;
      await expect(
        service.enviar(tipo, entidad.id, usuario),
      ).resolves.toBeDefined();
    }
  });

  describe('proyectos', () => {
    let proyecto: Proyecto;
    let proyectoRepository: typeof repositorio;
    let conteos: Map<unknown, number>;

    beforeEach(() => {
      proyecto = {
        id: 20,
        nombre: 'Proyecto creado por error',
        activo: true,
        finalizado_at: null,
        deleted_at: null,
        activo_antes_papelera: null,
      } as Proyecto;
      proyectoRepository = {
        ...repositorio,
        findOneBy: jest.fn().mockResolvedValue(proyecto),
        save: jest.fn((value) => Promise.resolve(value)),
        remove: jest.fn().mockResolvedValue(undefined),
      };
      conteos = new Map();
      const dataSource = {
        getRepository: jest.fn((target: unknown) => {
          if (target === Proyecto) return proyectoRepository;
          return {
            find: jest.fn().mockResolvedValue([]),
            findOneBy: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              getCount: jest.fn(() =>
                Promise.resolve(conteos.get(target) ?? 0),
              ),
            })),
          };
        }),
      };
      service = new PapeleraService(
        dataSource as unknown as DataSource,
        auditoria as unknown as AuditoriaService,
        suspensiones as unknown as SuspensionesService,
      );
    });

    it('envía un proyecto activo sin historial a Papelera y permite restaurarlo', async () => {
      await service.enviar('proyecto', proyecto.id, usuario);

      expect(proyecto).toMatchObject({
        activo: false,
        activo_antes_papelera: true,
      });
      expect(proyecto.deleted_at).toBeInstanceOf(Date);
      expect(suspensiones.finalizarPorPapelera).not.toHaveBeenCalled();

      await service.restaurar('proyecto', proyecto.id, usuario);

      expect(proyecto).toMatchObject({
        activo: true,
        activo_antes_papelera: null,
        deleted_at: null,
      });
    });

    it('envía un proyecto activo con historial sin modificar sus relaciones', async () => {
      conteos.set(Viaje, 1);

      const item = await service.enviar('proyecto', proyecto.id, usuario);

      expect(item.tiene_historial).toBe(true);
      expect(proyectoRepository.remove).not.toHaveBeenCalled();
      expect(conteos.get(Viaje)).toBe(1);
    });

    it('conserva como baja un proyecto vencido con historial', async () => {
      proyecto.activo = false;
      proyecto.activo_antes_papelera = true;
      proyecto.deleted_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      proyectoRepository.find.mockResolvedValue([proyecto]);
      conteos.set(OrdenAcarreo, 1);

      await service.depurarVencidos();
      expect(proyectoRepository.remove).not.toHaveBeenCalled();
      expect(proyecto).toMatchObject({ activo: false, deleted_at: null });
    });

    it('mantiene el estado finalizado al restaurar un proyecto finalizado', async () => {
      proyecto.activo = false;
      proyecto.finalizado_at = new Date();

      await service.enviar('proyecto', proyecto.id, usuario);
      await service.restaurar('proyecto', proyecto.id, usuario);

      expect(proyecto.activo).toBe(false);
      expect(proyecto.finalizado_at).toBeInstanceOf(Date);
    });

    it('considera todas las relaciones operativas al evaluar historial', async () => {
      for (const target of [
        Viaje,
        Ubicacion,
        OrdenAcarreo,
        Tarifa,
        Estimacion,
      ]) {
        conteos.clear();
        conteos.set(target, 1);
        proyecto.activo = true;
        proyecto.deleted_at = null;
        proyecto.activo_antes_papelera = null;

        const item = await service.enviar('proyecto', proyecto.id, usuario);

        expect(item.tiene_historial).toBe(true);
      }
    });
  });
});
