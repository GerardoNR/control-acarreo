import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { Ubicacion } from './ubicacion.entity';

@Injectable()
export class UbicacionesService {
  constructor(
    @InjectRepository(Ubicacion)
    private readonly ubicacionesRepository: Repository<Ubicacion>,
    @InjectRepository(Proyecto)
    private readonly proyectosRepository: Repository<Proyecto>,
  ) {}

  findAll(): Promise<Ubicacion[]> {
    return this.ubicacionesRepository.find({
      relations: { proyecto: true },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Ubicacion> {
    const ubicacion = await this.ubicacionesRepository.findOne({
      where: { id },
      relations: { proyecto: true },
    });
    if (!ubicacion)
      throw new NotFoundException(`Ubicación con id ${id} no encontrada`);
    return ubicacion;
  }

  async create(dto: CreateUbicacionDto): Promise<Ubicacion> {
    const proyecto = await this.findProyecto(dto.proyecto_id);
    const { proyecto_id: _, ...datos } = dto;
    return this.ubicacionesRepository.save(
      this.ubicacionesRepository.create({ ...datos, proyecto }),
    );
  }

  async update(id: number, dto: UpdateUbicacionDto): Promise<Ubicacion> {
    const ubicacion = await this.findOne(id);
    const { proyecto_id, ...datos } = dto;
    Object.assign(ubicacion, datos);
    if (proyecto_id !== undefined)
      ubicacion.proyecto = await this.findProyecto(proyecto_id);
    await this.ubicacionesRepository.save(ubicacion);
    return this.findOne(id);
  }

  async cambiarEstado(id: number, activo: boolean): Promise<Ubicacion> {
    const ubicacion = await this.findOne(id);
    ubicacion.activo = activo;
    await this.ubicacionesRepository.save(ubicacion);
    return this.findOne(id);
  }

  private async findProyecto(id: number): Promise<Proyecto> {
    const proyecto = await this.proyectosRepository.findOneBy({ id });
    if (!proyecto)
      throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    return proyecto;
  }
}
