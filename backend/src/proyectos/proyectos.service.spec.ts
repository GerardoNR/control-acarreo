import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Role } from '../auth/enums/role.enum';
import { Proyecto } from './proyecto.entity';
import { ProyectosService } from './proyectos.service';

describe('ProyectosService - finalizar', () => {
  const usuario = {
    id: 1,
    nombre: 'Administrador',
    usuario: 'admin',
    rol: Role.ADMINISTRADOR,
  };
  let proyecto: Proyecto;
  let repository: { findOneBy: jest.Mock; save: jest.Mock };
  let auditoria: { registrar: jest.Mock };
  let service: ProyectosService;

  beforeEach(() => {
    proyecto = {
      id: 1,
      nombre: 'Proyecto Anáhuac',
      activo: true,
      finalizado_at: null,
    } as Proyecto;
    repository = {
      findOneBy: jest.fn().mockResolvedValue(proyecto),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    auditoria = { registrar: jest.fn().mockResolvedValue({}) };
    service = new ProyectosService(
      repository as unknown as Repository<Proyecto>,
      auditoria as unknown as AuditoriaService,
    );
  });

  it('finaliza sin eliminar y registra auditoría', async () => {
    const resultado = await service.finalizar(proyecto.id, usuario);

    expect(resultado.activo).toBe(false);
    expect(resultado.finalizado_at).toBeInstanceOf(Date);
    expect(repository.save).toHaveBeenCalledWith(proyecto);
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'FINALIZAR_PROYECTO' }),
    );
  });

  it('no permite reactivar un proyecto finalizado', async () => {
    proyecto.finalizado_at = new Date();

    await expect(
      service.cambiarEstado(proyecto.id, true),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
