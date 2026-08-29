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
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { Viaje } from '../viajes/viaje.entity';
import {
  CreateRutaAcarreoDto,
  UpdateRutaAcarreoDto,
} from './dto/ruta-acarreo.dto';
import { RutaAcarreo } from './ruta-acarreo.entity';

@Injectable()
export class RutasAcarreoService {
  constructor(
    @InjectRepository(RutaAcarreo)
    private readonly repository: Repository<RutaAcarreo>,
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar() {
    return this.repository.find({
      relations: {
        proyecto: true,
        ubicacion_origen: true,
        ubicacion_destino: true,
      },
      order: { vigente_desde: 'DESC', clave: 'ASC' },
    });
  }

  async obtener(id: number) {
    const ruta = await this.repository.findOne({
      where: { id },
      relations: {
        proyecto: true,
        ubicacion_origen: true,
        ubicacion_destino: true,
      },
    });
    if (!ruta)
      throw new NotFoundException(`Ruta de acarreo con id ${id} no encontrada`);
    return ruta;
  }

  async crear(dto: CreateRutaAcarreoDto, usuario: AuthUser) {
    const refs = await this.validar(dto);
    const ruta = await this.guardar(
      this.repository.create({
        ...refs,
        clave: dto.clave,
        descripcion: dto.descripcion || null,
        distancia_pavimento: dto.distancia_pavimento.toFixed(3),
        distancia_total: dto.distancia_total.toFixed(3),
        vigente_desde: dto.vigente_desde,
        vigente_hasta: dto.vigente_hasta ?? null,
        activo: true,
      }),
    );
    await this.auditoria.registrar({
      usuario,
      accion: 'CREAR_RUTA_ACARREO',
      entidad: 'ruta_acarreo',
      entidadId: ruta.id,
    });
    return this.obtener(ruta.id);
  }

  async editar(id: number, dto: UpdateRutaAcarreoDto, usuario: AuthUser) {
    const ruta = await this.obtener(id);
    const tieneHistorial = await this.tieneHistorial(id);
    const cambiaOperacion = [
      dto.proyecto_id,
      dto.ubicacion_origen_id,
      dto.ubicacion_destino_id,
      dto.distancia_pavimento,
      dto.distancia_total,
      dto.vigente_desde,
    ].some((value) => value !== undefined);
    if (tieneHistorial && cambiaOperacion) {
      throw new ConflictException(
        'La ruta tiene historial. Cree una nueva vigencia para cambiar su recorrido o distancias.',
      );
    }
    const completo = {
      proyecto_id: dto.proyecto_id ?? ruta.proyecto.id,
      ubicacion_origen_id: dto.ubicacion_origen_id ?? ruta.ubicacion_origen.id,
      ubicacion_destino_id:
        dto.ubicacion_destino_id ?? ruta.ubicacion_destino.id,
      distancia_pavimento:
        dto.distancia_pavimento ?? Number(ruta.distancia_pavimento),
      distancia_total: dto.distancia_total ?? Number(ruta.distancia_total),
      vigente_desde: dto.vigente_desde ?? ruta.vigente_desde,
      vigente_hasta: dto.vigente_hasta ?? ruta.vigente_hasta ?? undefined,
    };
    Object.assign(ruta, await this.validar(completo), {
      clave: dto.clave ?? ruta.clave,
      descripcion:
        dto.descripcion === undefined
          ? ruta.descripcion
          : dto.descripcion || null,
      distancia_pavimento: completo.distancia_pavimento.toFixed(3),
      distancia_total: completo.distancia_total.toFixed(3),
      vigente_desde: completo.vigente_desde,
      vigente_hasta: completo.vigente_hasta ?? null,
      activo: dto.activo ?? ruta.activo,
    });
    await this.guardar(ruta);
    await this.auditoria.registrar({
      usuario,
      accion: 'EDITAR_RUTA_ACARREO',
      entidad: 'ruta_acarreo',
      entidadId: id,
    });
    return this.obtener(id);
  }

  async cambiarEstado(id: number, activo: boolean, usuario: AuthUser) {
    const ruta = await this.obtener(id);
    ruta.activo = activo;
    await this.repository.save(ruta);
    await this.auditoria.registrar({
      usuario,
      accion: activo ? 'REACTIVAR_RUTA_ACARREO' : 'RETIRAR_RUTA_ACARREO',
      entidad: 'ruta_acarreo',
      entidadId: id,
    });
    return this.obtener(id);
  }

  private async validar(dto: {
    proyecto_id: number;
    ubicacion_origen_id: number;
    ubicacion_destino_id: number;
    distancia_pavimento: number;
    distancia_total: number;
    vigente_desde: string;
    vigente_hasta?: string;
  }) {
    if (dto.ubicacion_origen_id === dto.ubicacion_destino_id)
      throw new BadRequestException('Origen y destino deben ser diferentes');
    if (dto.distancia_pavimento > dto.distancia_total)
      throw new BadRequestException(
        'La distancia pavimentada no puede exceder la distancia total',
      );
    if (dto.vigente_hasta && dto.vigente_hasta < dto.vigente_desde)
      throw new BadRequestException(
        'La vigencia final debe ser posterior a la inicial',
      );
    const [proyecto, origen, destino] = await Promise.all([
      this.dataSource
        .getRepository(Proyecto)
        .findOneBy({ id: dto.proyecto_id }),
      this.dataSource.getRepository(Ubicacion).findOne({
        where: { id: dto.ubicacion_origen_id },
        relations: { proyecto: true },
      }),
      this.dataSource.getRepository(Ubicacion).findOne({
        where: { id: dto.ubicacion_destino_id },
        relations: { proyecto: true },
      }),
    ]);
    if (!proyecto || !origen || !destino)
      throw new BadRequestException('Proyecto u ubicaciones no válidos');
    if (
      origen.proyecto.id !== proyecto.id ||
      destino.proyecto.id !== proyecto.id
    )
      throw new BadRequestException(
        'Las ubicaciones deben pertenecer al proyecto',
      );
    return { proyecto, ubicacion_origen: origen, ubicacion_destino: destino };
  }

  private async tieneHistorial(id: number) {
    const [viajes, ordenes] = await Promise.all([
      this.dataSource
        .getRepository(Viaje)
        .count({ where: { ruta_acarreo: { id } } }),
      this.dataSource
        .getRepository(OrdenAcarreo)
        .count({ where: { ruta_acarreo: { id } } }),
    ]);
    return viajes + ordenes > 0;
  }

  private async guardar(ruta: RutaAcarreo) {
    try {
      return await this.repository.save(ruta);
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException(
          'Ya existe una ruta con esa clave y vigencia para el proyecto',
        );
      throw error;
    }
  }
}
