import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from './checador.entity';
import { ChecadoresService } from './checadores.service';

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
