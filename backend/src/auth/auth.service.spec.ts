import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from '../checadores/checador.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Role } from './enums/role.enum';

const repositoryWithResult = <T>(result: T | null) => {
  const queryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
  return {
    queryBuilder,
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
};

describe('AuthService - identidad normalizada', () => {
  it('autentica con el usuario normalizado por el DTO', async () => {
    const password_hash = await bcrypt.hash('password', 4);
    const administradores = repositoryWithResult({
      id: 1,
      nombre: 'Ana López',
      usuario: 'Ana.Admin',
      password_hash,
    } as Administrador);
    const checadores = repositoryWithResult<Checador>(null);
    const jwtService = { signAsync: jest.fn().mockResolvedValue('token') };
    const configService = { get: jest.fn().mockReturnValue('8h') };
    const service = new AuthService(
      administradores as unknown as Repository<Administrador>,
      checadores as unknown as Repository<Checador>,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
    const dto = plainToInstance(LoginDto, {
      usuario: '  ANA.ADMIN ',
      password: 'password',
    });

    await expect(service.login(dto)).resolves.toMatchObject({
      access_token: 'token',
      usuario: { usuario: 'Ana.Admin', rol: Role.ADMINISTRADOR },
    });
    expect(administradores.queryBuilder.where).toHaveBeenCalledWith(
      'LOWER(administrador.usuario) = :usuario',
      { usuario: 'ana.admin' },
    );
  });

  it('rechaza una identidad activa presente en ambas tablas', async () => {
    const identidad = {
      id: 1,
      nombre: 'Identidad duplicada',
      usuario: 'duplicado',
      password_hash: 'hash',
    };
    const service = new AuthService(
      repositoryWithResult(identidad) as unknown as Repository<Administrador>,
      repositoryWithResult(identidad) as unknown as Repository<Checador>,
      { signAsync: jest.fn() } as unknown as JwtService,
      { get: jest.fn() } as unknown as ConfigService,
    );

    await expect(
      service.login({ usuario: 'duplicado', password: 'password' }),
    ).rejects.toThrow('Credenciales inválidas');
  });
});
