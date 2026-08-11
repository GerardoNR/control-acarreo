import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { Administrador } from './administrador.entity';
import { CreateAdministradorDto } from './dto/create-administrador.dto';
import { UpdateAdministradorDto } from './dto/update-administrador.dto';

type AdministradorResponse = Omit<Administrador, 'password_hash'>;

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AdministradoresService {
  constructor(
    @InjectRepository(Administrador)
    private readonly administradoresRepository: Repository<Administrador>,
  ) {}

  async findAll(): Promise<AdministradorResponse[]> {
    const administradores = await this.administradoresRepository.find({
      order: { nombre: 'ASC', id: 'ASC' },
    });
    return administradores.map((administrador) =>
      this.toResponse(administrador),
    );
  }

  async findOne(id: number): Promise<AdministradorResponse> {
    return this.toResponse(await this.findEntity(id));
  }

  async create(dto: CreateAdministradorDto): Promise<AdministradorResponse> {
    await this.ensureUsuarioDisponible(dto.usuario);
    const administrador = this.administradoresRepository.create({
      nombre: dto.nombre,
      usuario: dto.usuario,
      password_hash: await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS),
    });

    try {
      return this.toResponse(
        await this.administradoresRepository.save(administrador),
      );
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async update(
    id: number,
    dto: UpdateAdministradorDto,
  ): Promise<AdministradorResponse> {
    const administrador = await this.findEntity(id);
    if (
      dto.usuario !== undefined &&
      dto.usuario !== administrador.usuario
    ) {
      await this.ensureUsuarioDisponible(dto.usuario, id);
      administrador.usuario = dto.usuario;
    }
    if (dto.nombre !== undefined) administrador.nombre = dto.nombre;
    if (dto.password !== undefined) {
      administrador.password_hash = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );
    }

    try {
      return this.toResponse(
        await this.administradoresRepository.save(administrador),
      );
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async cambiarEstado(
    id: number,
    activo: boolean,
  ): Promise<AdministradorResponse> {
    const administrador = await this.findEntity(id);
    administrador.activo = activo;
    return this.toResponse(
      await this.administradoresRepository.save(administrador),
    );
  }

  private async findEntity(id: number): Promise<Administrador> {
    const administrador = await this.administradoresRepository.findOneBy({
      id,
    });
    if (!administrador) {
      throw new NotFoundException(`Administrador con id ${id} no encontrado`);
    }
    return administrador;
  }

  private async ensureUsuarioDisponible(
    usuario: string,
    currentId?: number,
  ): Promise<void> {
    const existente = await this.administradoresRepository.findOneBy({
      usuario,
    });
    if (existente && existente.id !== currentId) {
      throw new ConflictException(
        'Ya existe un administrador con ese usuario',
      );
    }
  }

  private toResponse(administrador: Administrador): AdministradorResponse {
    const { password_hash: _passwordHash, ...response } = administrador;
    return response;
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };
      if (driverError.code === '23505') {
        throw new ConflictException(
          'Ya existe un administrador con ese usuario',
        );
      }
    }
    throw error;
  }
}
