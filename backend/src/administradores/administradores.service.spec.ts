import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Checador } from '../checadores/checador.entity';
import { Administrador } from './administrador.entity';
import { AdministradoresService } from './administradores.service';

const repositoryWithResult = <T>(result: T | null) => ({
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  })),
});

describe('AdministradoresService - identidad', () => {
  it('rechaza un usuario que ya pertenece a un checador', async () => {
    const administradores = repositoryWithResult<Administrador>(null);
    const checadores = repositoryWithResult({ id: 7 } as Checador);
    const service = new AdministradoresService(
      administradores as unknown as Repository<Administrador>,
      checadores as unknown as Repository<Checador>,
    );

    await expect(
      service.create({
        nombre: 'Ana López',
        usuario: 'identidad',
        password: 'password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
