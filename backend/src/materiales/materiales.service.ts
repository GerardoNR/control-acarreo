import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { Material } from './material.entity';

@Injectable()
export class MaterialesService {
  constructor(
    @InjectRepository(Material)
    private readonly materialesRepository: Repository<Material>,
  ) {}

  findAll(): Promise<Material[]> {
    return this.materialesRepository.find({
      where: { deleted_at: IsNull() },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialesRepository.findOneBy({
      id,
      deleted_at: IsNull(),
    });
    if (!material)
      throw new NotFoundException(`Material con id ${id} no encontrado`);
    return material;
  }

  create(dto: CreateMaterialDto): Promise<Material> {
    return this.materialesRepository.save(
      this.materialesRepository.create(dto),
    );
  }

  async update(id: number, dto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOne(id);
    return this.materialesRepository.save(Object.assign(material, dto));
  }

  async cambiarEstado(id: number, activo: boolean): Promise<Material> {
    const material = await this.findOne(id);
    material.activo = activo;
    return this.materialesRepository.save(material);
  }
}
