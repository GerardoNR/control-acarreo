import {
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from '../checadores/checador.entity';
import { LoginDto } from './dto/login.dto';
import { Role } from './enums/role.enum';
import { AuthUser } from './interfaces/auth-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SuspensionesService } from '../suspensiones/suspensiones.service';
import { TipoEntidadSuspension } from '../suspensiones/suspension.entity';

type UsuarioConPassword = AuthUser & { password_hash: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Administrador)
    private readonly administradoresRepository: Repository<Administrador>,
    @InjectRepository(Checador)
    private readonly checadoresRepository: Repository<Checador>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly suspensionesService?: SuspensionesService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.findUsuarioConPassword(dto.usuario);
    const passwordValido =
      usuario !== null &&
      (await bcrypt.compare(dto.password, usuario.password_hash));

    if (!usuario || !passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (
      usuario.rol === Role.CHECADOR &&
      (await this.suspensionesService?.estaSuspendido(
        TipoEntidadSuspension.CHECADOR,
        usuario.id,
      )) === true
    ) {
      throw new ForbiddenException(
        'La cuenta está suspendida temporalmente. Contacta al administrador.',
      );
    }

    const perfil: AuthUser = {
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      rol: usuario.rol,
    };
    const payload: JwtPayload = {
      sub: perfil.id,
      usuario: perfil.usuario,
      rol: perfil.rol,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      token_type: 'Bearer',
      expires_in: this.configService.get<string>('JWT_EXPIRES_IN') ?? '8h',
      usuario: perfil,
    };
  }

  private async findUsuarioConPassword(
    usuario: string,
  ): Promise<UsuarioConPassword | null> {
    const administradorQuery = this.administradoresRepository
      .createQueryBuilder('administrador')
      .addSelect('administrador.password_hash')
      .where('LOWER(administrador.usuario) = :usuario', { usuario })
      .andWhere('administrador.activo = :activo', { activo: true })
      .getOne();

    const checadorQuery = this.checadoresRepository
      .createQueryBuilder('checador')
      .addSelect('checador.password_hash')
      .where('LOWER(checador.usuario) = :usuario', { usuario })
      .andWhere('checador.activo = :activo', { activo: true })
      .getOne();
    const [administrador, checador] = await Promise.all([
      administradorQuery,
      checadorQuery,
    ]);

    if (administrador && !checador) {
      return {
        id: administrador.id,
        nombre: administrador.nombre,
        usuario: administrador.usuario,
        rol: Role.ADMINISTRADOR,
        password_hash: administrador.password_hash,
      };
    }

    if (!checador || administrador) return null;

    return {
      id: checador.id,
      nombre: checador.nombre,
      usuario: checador.usuario,
      rol: Role.CHECADOR,
      password_hash: checador.password_hash,
    };
  }
}
