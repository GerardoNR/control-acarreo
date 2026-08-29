import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from './checador.entity';
import { CreateChecadorDto } from './dto/create-checador.dto';
import { UpdateChecadorDto } from './dto/update-checador.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

type ChecadorResponse = Omit<Checador, 'password_hash'>;

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class ChecadoresService {
  constructor(
    @InjectRepository(Checador)
    private readonly checadoresRepository: Repository<Checador>,
    @InjectRepository(Administrador)
    private readonly administradoresRepository: Repository<Administrador>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async findAll(): Promise<ChecadorResponse[]> {
    const checadores = await this.checadoresRepository.find({
      where: { deleted_at: IsNull() },
      order: { nombre: 'ASC', id: 'ASC' },
    });
    return checadores.map((checador) => this.toResponse(checador));
  }

  async findOne(id: number): Promise<ChecadorResponse> {
    return this.toResponse(await this.findEntity(id));
  }

  async create(dto: CreateChecadorDto): Promise<ChecadorResponse> {
    await this.ensureUsuarioDisponible(dto.usuario);
    const checador = this.checadoresRepository.create({
      nombre: dto.nombre,
      telefono: dto.telefono,
      usuario: dto.usuario,
      password_hash: await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS),
    });

    try {
      return this.toResponse(await this.checadoresRepository.save(checador));
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async update(
    id: number,
    dto: UpdateChecadorDto,
    usuario: AuthUser,
  ): Promise<ChecadorResponse> {
    const checador = await this.findEntity(id);
    if (dto.usuario !== undefined && dto.usuario !== checador.usuario) {
      await this.ensureUsuarioDisponible(dto.usuario, id);
      checador.usuario = dto.usuario;
    }
    if (dto.nombre !== undefined) checador.nombre = dto.nombre;
    if (dto.telefono !== undefined) checador.telefono = dto.telefono;
    if (dto.password !== undefined) {
      checador.password_hash = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );
    }

    try {
      const response = this.toResponse(
        await this.checadoresRepository.save(checador),
      );
      if (dto.password !== undefined) {
        await this.auditoriaService.registrar({
          usuario,
          accion: 'RESTABLECER_PASSWORD_CHECADOR',
          entidad: 'checador',
          entidadId: id,
        });
      }
      return response;
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async cambiarEstado(id: number, activo: boolean): Promise<ChecadorResponse> {
    const checador = await this.findEntity(id);
    checador.activo = activo;
    return this.toResponse(await this.checadoresRepository.save(checador));
  }

  private async findEntity(id: number): Promise<Checador> {
    const checador = await this.checadoresRepository.findOneBy({
      id,
      deleted_at: IsNull(),
    });
    if (!checador) {
      throw new NotFoundException(`Checador con id ${id} no encontrado`);
    }
    return checador;
  }

  private async ensureUsuarioDisponible(
    usuario: string,
    currentId?: number,
  ): Promise<void> {
    const existente = await this.checadoresRepository
      .createQueryBuilder('checador')
      .where('LOWER(checador.usuario) = :usuario', { usuario })
      .getOne();
    if (existente && existente.id !== currentId) {
      throw new ConflictException('Ya existe un checador con ese usuario');
    }
    const administrador = await this.administradoresRepository
      .createQueryBuilder('administrador')
      .where('LOWER(administrador.usuario) = :usuario', { usuario })
      .getOne();
    if (administrador) {
      throw new ConflictException('Ya existe un administrador con ese usuario');
    }
  }

  private toResponse(checador: Checador): ChecadorResponse {
    const { password_hash, ...response } = checador;
    void password_hash;
    return response;
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };
      if (driverError.code === '23505') {
        throw new ConflictException('Ya existe un checador con ese usuario');
      }
    }
    throw error;
  }
}
