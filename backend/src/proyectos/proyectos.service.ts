import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { Proyecto } from './proyecto.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto)
    private readonly proyectosRepository: Repository<Proyecto>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  findAll(): Promise<Proyecto[]> {
    return this.proyectosRepository.find({
      where: { deleted_at: IsNull() },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Proyecto> {
    const proyecto = await this.proyectosRepository.findOneBy({
      id,
      deleted_at: IsNull(),
    });
    if (!proyecto)
      throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    return proyecto;
  }

  async create(dto: CreateProyectoDto): Promise<Proyecto> {
    try {
      return await this.proyectosRepository.save(
        this.proyectosRepository.create(dto),
      );
    } catch (error) {
      this.handleDuplicateKey(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateProyectoDto): Promise<Proyecto> {
    const proyecto = await this.findOne(id);
    try {
      return await this.proyectosRepository.save(Object.assign(proyecto, dto));
    } catch (error) {
      this.handleDuplicateKey(error);
      throw error;
    }
  }

  async cambiarEstado(id: number, activo: boolean): Promise<Proyecto> {
    const proyecto = await this.findOne(id);
    if (activo && proyecto.finalizado_at) {
      throw new ConflictException(
        'Un proyecto finalizado no puede reactivarse',
      );
    }
    proyecto.activo = activo;
    return this.proyectosRepository.save(proyecto);
  }

  async finalizar(id: number, usuario: AuthUser): Promise<Proyecto> {
    const proyecto = await this.findOne(id);
    if (proyecto.finalizado_at) {
      throw new ConflictException('El proyecto ya está finalizado');
    }
    const finalizadoAt = new Date();
    proyecto.activo = false;
    proyecto.finalizado_at = finalizadoAt;
    const resultado = await this.proyectosRepository.save(proyecto);
    await this.auditoriaService.registrar({
      usuario,
      accion: 'FINALIZAR_PROYECTO',
      entidad: 'proyecto',
      entidadId: id,
      valorAnterior: { activo: true, finalizado_at: null },
      valorNuevo: { activo: false, finalizado_at: finalizadoAt.toISOString() },
    });
    return resultado;
  }

  private handleDuplicateKey(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { code?: string }).code === '23505'
    ) {
      throw new ConflictException('La clave del proyecto ya existe');
    }
  }
}
