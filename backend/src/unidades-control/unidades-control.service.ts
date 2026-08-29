import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { OrdenAcarreo } from '../ordenes-acarreo/orden-acarreo.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import {
  CreateUnidadControlDto,
  ConsultarUnidadesControlDto,
  UpdateUnidadControlDto,
} from './dto/unidad-control.dto';
import { UnidadControl } from './unidad-control.entity';

@Injectable()
export class UnidadesControlService {
  constructor(
    @InjectRepository(UnidadControl)
    private readonly repository: Repository<UnidadControl>,
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(filtros: ConsultarUnidadesControlDto = {}) {
    return this.repository.find({
      where: {
        ...(filtros.proyecto_id
          ? { proyecto: { id: filtros.proyecto_id } }
          : {}),
        ...(filtros.activo !== undefined ? { activo: filtros.activo } : {}),
      },
      relations: { proyecto: true },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async obtener(id: number) {
    const unidad = await this.repository.findOne({
      where: { id },
      relations: { proyecto: true },
    });
    if (!unidad)
      throw new NotFoundException(
        `Unidad de control con id ${id} no encontrada`,
      );
    return unidad;
  }

  async crear(dto: CreateUnidadControlDto, usuario: AuthUser) {
    const proyecto = await this.obtenerProyecto(dto.proyecto_id);
    const unidad = await this.guardar(
      this.repository.create({
        proyecto,
        nombre: dto.nombre,
        descripcion: dto.descripcion || null,
        activo: true,
      }),
    );
    await this.auditoria.registrar({
      usuario,
      accion: 'CREAR_UNIDAD_CONTROL',
      entidad: 'unidad_control',
      entidadId: unidad.id,
    });
    return this.obtener(unidad.id);
  }

  async editar(id: number, dto: UpdateUnidadControlDto, usuario: AuthUser) {
    const unidad = await this.obtener(id);
    if (
      dto.proyecto_id !== undefined &&
      dto.proyecto_id !== unidad.proyecto.id
    ) {
      const ordenes = await this.dataSource
        .getRepository(OrdenAcarreo)
        .count({ where: { unidad_control: { id } } });
      if (ordenes > 0)
        throw new ConflictException(
          'No puede cambiarse el proyecto de una unidad con historial',
        );
      unidad.proyecto = await this.obtenerProyecto(dto.proyecto_id);
    }
    if (dto.nombre !== undefined) unidad.nombre = dto.nombre;
    if (dto.descripcion !== undefined)
      unidad.descripcion = dto.descripcion || null;
    if (dto.activo !== undefined) unidad.activo = dto.activo;
    await this.guardar(unidad);
    await this.auditoria.registrar({
      usuario,
      accion: 'EDITAR_UNIDAD_CONTROL',
      entidad: 'unidad_control',
      entidadId: id,
    });
    return this.obtener(id);
  }

  async cambiarEstado(id: number, activo: boolean, usuario: AuthUser) {
    const unidad = await this.obtener(id);
    unidad.activo = activo;
    await this.repository.save(unidad);
    await this.auditoria.registrar({
      usuario,
      accion: activo ? 'REACTIVAR_UNIDAD_CONTROL' : 'RETIRAR_UNIDAD_CONTROL',
      entidad: 'unidad_control',
      entidadId: id,
    });
    return this.obtener(id);
  }

  private async obtenerProyecto(id: number) {
    const proyecto = await this.dataSource
      .getRepository(Proyecto)
      .findOneBy({ id });
    if (!proyecto)
      throw new BadRequestException(`Proyecto con id ${id} no encontrado`);
    return proyecto;
  }

  private async guardar(unidad: UnidadControl) {
    try {
      return await this.repository.save(unidad);
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException(
          'Ya existe una unidad de control con ese nombre en el proyecto',
        );
      throw error;
    }
  }
}
