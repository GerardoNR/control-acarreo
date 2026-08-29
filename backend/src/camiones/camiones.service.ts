import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { Camion } from './camion.entity';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';

@Injectable()
export class CamionesService {
  constructor(
    @InjectRepository(Camion)
    private readonly camionesRepository: Repository<Camion>,
  ) {}

  findAll(): Promise<Camion[]> {
    return this.camionesRepository.find({
      where: { deleted_at: IsNull() },
      order: { placas: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Camion> {
    const camion = await this.camionesRepository.findOneBy({
      id,
      deleted_at: IsNull(),
    });
    if (!camion) {
      throw new NotFoundException(`Camión con id ${id} no encontrado`);
    }
    return camion;
  }

  async findByNfc(uid: string): Promise<Camion> {
    const camion = await this.camionesRepository.findOneBy({
      nfc_tag_uid: uid,
      activo: true,
      deleted_at: IsNull(),
    });
    if (!camion) {
      throw new NotFoundException(`No existe un camión con el UID NFC ${uid}`);
    }
    return camion;
  }

  async create(dto: CreateCamionDto): Promise<Camion> {
    const camion = this.camionesRepository.create({
      ...dto,
      capacidad_m3: dto.capacidad_m3.toString(),
    });
    try {
      return await this.camionesRepository.save(camion);
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async update(id: number, dto: UpdateCamionDto): Promise<Camion> {
    const camion = await this.findOne(id);
    if (
      dto.codigo_ticket_unidad !== undefined &&
      camion.codigo_ticket_unidad !== null &&
      dto.codigo_ticket_unidad !== camion.codigo_ticket_unidad
    ) {
      throw new ConflictException(
        'El código de ticket de la unidad es inmutable una vez asignado',
      );
    }
    const { capacidad_m3, ...campos } = dto;
    Object.assign(camion, campos);
    if (capacidad_m3 !== undefined) {
      camion.capacidad_m3 = capacidad_m3.toString();
    }

    try {
      return await this.camionesRepository.save(camion);
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async cambiarEstado(id: number, activo: boolean): Promise<Camion> {
    const camion = await this.findOne(id);
    camion.activo = activo;
    return this.camionesRepository.save(camion);
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
        detail?: string;
      };

      if (driverError.code === '23505') {
        const source = `${driverError.constraint ?? ''} ${driverError.detail ?? ''}`;
        if (source.includes('nfc_tag_uid')) {
          throw new ConflictException(
            'El UID NFC ya está asignado a otro camión',
          );
        }
        if (source.includes('numero_economico')) {
          throw new ConflictException(
            'Ya existe un camión con ese número económico',
          );
        }
        if (source.includes('codigo_ticket_unidad')) {
          throw new ConflictException(
            'El código de ticket de la unidad ya está asignado a otro camión',
          );
        }
        if (source.includes('placas')) {
          throw new ConflictException('Ya existe un camión con esas placas');
        }
        throw new ConflictException('Ya existe un camión con esos datos');
      }
    }

    throw error;
  }
}
