import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from './checador.entity';
import { ChecadoresService } from './checadores.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Role } from '../auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

const repositoryWithResult = <T>(result: T | null) => ({
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  })),
});

describe('ChecadoresService - identidad', () => {
  it('rechaza un usuario que ya pertenece a un administrador', async () => {
    const checadores = repositoryWithResult<Checador>(null);
    const administradores = repositoryWithResult({ id: 3 } as Administrador);
    const service = new ChecadoresService(
      checadores as unknown as Repository<Checador>,
      administradores as unknown as Repository<Administrador>,
      { registrar: jest.fn() } as unknown as AuditoriaService,
    );

    await expect(
      service.create({
        nombre: 'Óscar Núñez',
        usuario: 'identidad',
        password: 'password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ChecadoresService - contraseñas', () => {
  const usuario = {
    id: 1,
    nombre: 'Administrador',
    usuario: 'admin',
    rol: Role.ADMINISTRADOR,
  };
  let checador: Checador;
  let checadores: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let auditoria: { registrar: jest.Mock };
  let service: ChecadoresService;

  beforeEach(async () => {
    checador = {
      id: 7,
      nombre: 'María López',
      telefono: '8112345678',
      usuario: 'maria',
      password_hash: await bcrypt.hash('password-anterior', 4),
      activo: true,
      ultimo_acceso: null,
    } as Checador;
    checadores = {
      findOneBy: jest.fn().mockResolvedValue(checador),
      save: jest.fn((value) => Promise.resolve(value)),
      create: jest.fn((value) => value),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };
    auditoria = { registrar: jest.fn().mockResolvedValue({}) };
    service = new ChecadoresService(
      checadores as unknown as Repository<Checador>,
      repositoryWithResult<Administrador>(
        null,
      ) as unknown as Repository<Administrador>,
      auditoria as unknown as AuditoriaService,
    );
  });

  it('crea usando hash y no expone password ni password_hash', async () => {
    const response = await service.create({
      nombre: 'María López',
      telefono: '8112345678',
      usuario: 'maria',
      password: 'password-nueva',
    });

    expect(checadores.save.mock.calls[0][0].password_hash).not.toBe(
      'password-nueva',
    );
    await expect(
      bcrypt.compare(
        'password-nueva',
        checadores.save.mock.calls[0][0].password_hash,
      ),
    ).resolves.toBe(true);
    expect(response).not.toHaveProperty('password');
    expect(response).not.toHaveProperty('password_hash');
  });

  it('edita datos sin cambiar el hash existente', async () => {
    const hashAnterior = checador.password_hash;

    await service.update(checador.id, { nombre: 'María Núñez' }, usuario);

    expect(checador.password_hash).toBe(hashAnterior);
    expect(auditoria.registrar).not.toHaveBeenCalled();
  });

  it('restablece el hash, invalida la contraseña anterior y registra auditoría sin datos sensibles', async () => {
    await service.update(checador.id, { password: 'password-nueva' }, usuario);

    await expect(
      bcrypt.compare('password-anterior', checador.password_hash),
    ).resolves.toBe(false);
    await expect(
      bcrypt.compare('password-nueva', checador.password_hash),
    ).resolves.toBe(true);
    expect(auditoria.registrar).toHaveBeenCalledWith({
      usuario,
      accion: 'RESTABLECER_PASSWORD_CHECADOR',
      entidad: 'checador',
      entidadId: checador.id,
    });
  });
});
