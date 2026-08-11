import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chofer } from './chofer.entity';
import { CreateChoferDto } from './dto/create-chofer.dto';
import { UpdateChoferDto } from './dto/update-chofer.dto';

@Injectable()
export class ChoferesService {
  constructor(
    @InjectRepository(Chofer)
    private readonly choferesRepository: Repository<Chofer>,
  ) {}

  findAll(): Promise<Chofer[]> {
    return this.choferesRepository.find({
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Chofer> {
    const chofer = await this.choferesRepository.findOneBy({ id });
    if (!chofer) {
      throw new NotFoundException(`Chofer con id ${id} no encontrado`);
    }
    return chofer;
  }

  create(dto: CreateChoferDto): Promise<Chofer> {
    return this.choferesRepository.save(this.choferesRepository.create(dto));
  }

  async update(id: number, dto: UpdateChoferDto): Promise<Chofer> {
    const chofer = await this.findOne(id);
    return this.choferesRepository.save(Object.assign(chofer, dto));
  }

  async cambiarEstado(id: number, activo: boolean): Promise<Chofer> {
    const chofer = await this.findOne(id);
    chofer.activo = activo;
    return this.choferesRepository.save(chofer);
  }
}
