import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Administrador } from '../../administradores/administrador.entity';
import { Checador } from '../../checadores/checador.entity';
import { Role } from '../enums/role.enum';
import { AuthUser } from '../interfaces/auth-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Administrador)
    private readonly administradoresRepository: Repository<Administrador>,
    @InjectRepository(Checador)
    private readonly checadoresRepository: Repository<Checador>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.rol === Role.ADMINISTRADOR) {
      const administrador = await this.administradoresRepository.findOneBy({
        id: payload.sub,
        activo: true,
      });
      if (!administrador || administrador.usuario !== payload.usuario) {
        throw new UnauthorizedException();
      }
      return {
        id: administrador.id,
        nombre: administrador.nombre,
        usuario: administrador.usuario,
        rol: Role.ADMINISTRADOR,
      };
    }

    if (payload.rol === Role.CHECADOR) {
      const checador = await this.checadoresRepository.findOneBy({
        id: payload.sub,
        activo: true,
      });
      if (!checador || checador.usuario !== payload.usuario) {
        throw new UnauthorizedException();
      }
      return {
        id: checador.id,
        nombre: checador.nombre,
        usuario: checador.usuario,
        rol: Role.CHECADOR,
      };
    }

    throw new UnauthorizedException();
  }
}
