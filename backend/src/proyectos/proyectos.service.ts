import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { Proyecto } from './proyecto.entity';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto)
    private readonly proyectosRepository: Repository<Proyecto>,
  ) {}

  findAll(): Promise<Proyecto[]> {
    return this.proyectosRepository.find({
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Proyecto> {
    const proyecto = await this.proyectosRepository.findOneBy({ id });
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
    proyecto.activo = activo;
    return this.proyectosRepository.save(proyecto);
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
