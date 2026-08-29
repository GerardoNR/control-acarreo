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
import { Material } from '../materiales/material.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Ubicacion } from '../ubicaciones/ubicacion.entity';
import { RutaAcarreo } from '../rutas-acarreo/ruta-acarreo.entity';
import { Viaje } from '../viajes/viaje.entity';
import { CreateTarifaDto, UpdateTarifaDto } from './dto/tarifa.dto';
import { Tarifa, TipoCobroTarifa } from './tarifa.entity';

@Injectable()
export class TarifasService {
  constructor(
    @InjectRepository(Tarifa) private readonly repository: Repository<Tarifa>,
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar() {
    return this.repository.find({
      relations: {
        proyecto: true,
        material: true,
        ubicacion_origen: true,
        ubicacion_destino: true,
        ruta_acarreo: true,
      },
      order: { vigente_desde: 'DESC', id: 'DESC' },
    });
  }
  async obtener(id: number) {
    const tarifa = await this.repository.findOne({
      where: { id },
      relations: {
        proyecto: true,
        material: true,
        ubicacion_origen: true,
        ubicacion_destino: true,
        ruta_acarreo: true,
      },
    });
    if (!tarifa)
      throw new NotFoundException(`Tarifa con id ${id} no encontrada`);
    return tarifa;
  }

  async crear(dto: CreateTarifaDto, usuario: AuthUser) {
    const refs = await this.validar(dto);
    const precios = this.normalizarPrecios(dto);
    await this.validarSolapamiento(dto, null);
    const tarifa = await this.repository.save(
      this.repository.create({
        ...refs,
        tipo_cobro: dto.tipo_cobro ?? TipoCobroTarifa.POR_VOLUMEN,
        unidad_medida: refs.material.unidad_medida,
        ...precios,
        vigente_desde: dto.vigente_desde,
        vigente_hasta: dto.vigente_hasta ?? null,
        activo: true,
      }),
    );
    await this.auditoria.registrar({
      usuario,
      accion: 'CREAR_TARIFA',
      entidad: 'tarifa',
      entidadId: tarifa.id,
    });
    return this.obtener(tarifa.id);
  }

  async editar(id: number, dto: UpdateTarifaDto, usuario: AuthUser) {
    const tarifa = await this.obtener(id);
    const cambiaCondicionEconomica = [
      dto.proyecto_id,
      dto.material_id,
      dto.ubicacion_origen_id,
      dto.ubicacion_destino_id,
      dto.ruta_acarreo_id,
      dto.tipo_cobro,
      dto.precio_unitario,
      dto.precio_primer_km,
      dto.precio_km_subsecuente,
      dto.vigente_desde,
    ].some((value) => value !== undefined);
    if (
      cambiaCondicionEconomica &&
      (await this.dataSource
        .getRepository(Viaje)
        .count({ where: { tarifa_aplicada: { id } } })) > 0
    ) {
      throw new ConflictException(
        'La tarifa tiene viajes asociados. Cree una nueva vigencia para cambiar sus condiciones económicas.',
      );
    }
    const completo = {
      proyecto_id: dto.proyecto_id ?? tarifa.proyecto.id,
      material_id: dto.material_id ?? tarifa.material.id,
      ubicacion_origen_id:
        dto.ubicacion_origen_id ?? tarifa.ubicacion_origen.id,
      ubicacion_destino_id:
        dto.ubicacion_destino_id ?? tarifa.ubicacion_destino.id,
      ruta_acarreo_id:
        dto.ruta_acarreo_id ?? tarifa.ruta_acarreo?.id ?? undefined,
      tipo_cobro: dto.tipo_cobro ?? tarifa.tipo_cobro,
      precio_unitario:
        dto.precio_unitario ??
        (tarifa.precio_unitario === null
          ? undefined
          : Number(tarifa.precio_unitario)),
      precio_primer_km:
        dto.precio_primer_km ??
        (tarifa.precio_primer_km === null
          ? undefined
          : Number(tarifa.precio_primer_km)),
      precio_km_subsecuente:
        dto.precio_km_subsecuente ??
        (tarifa.precio_km_subsecuente === null
          ? undefined
          : Number(tarifa.precio_km_subsecuente)),
      vigente_desde: dto.vigente_desde ?? tarifa.vigente_desde,
      vigente_hasta: dto.vigente_hasta ?? tarifa.vigente_hasta ?? undefined,
    };
    const refs = await this.validar(completo);
    const precios = this.normalizarPrecios(completo);
    if (dto.activo !== false) await this.validarSolapamiento(completo, id);
    Object.assign(tarifa, refs, {
      tipo_cobro: completo.tipo_cobro,
      unidad_medida: refs.material.unidad_medida,
      ...precios,
      vigente_desde: completo.vigente_desde,
      vigente_hasta: completo.vigente_hasta ?? null,
      activo: dto.activo ?? tarifa.activo,
    });
    await this.repository.save(tarifa);
    await this.auditoria.registrar({
      usuario,
      accion: 'EDITAR_TARIFA',
      entidad: 'tarifa',
      entidadId: id,
    });
    return this.obtener(id);
  }

  private async validar(
    dto: Pick<
      CreateTarifaDto,
      | 'proyecto_id'
      | 'material_id'
      | 'ubicacion_origen_id'
      | 'ubicacion_destino_id'
      | 'vigente_desde'
    > &
      Partial<CreateTarifaDto>,
  ) {
    if (dto.ubicacion_origen_id === dto.ubicacion_destino_id)
      throw new BadRequestException('Origen y destino deben ser diferentes');
    if (dto.vigente_hasta && dto.vigente_hasta < dto.vigente_desde)
      throw new BadRequestException(
        'La vigencia final debe ser posterior a la inicial',
      );
    const [proyecto, material, origen, destino, ruta] = await Promise.all([
      this.dataSource
        .getRepository(Proyecto)
        .findOneBy({ id: dto.proyecto_id }),
      this.dataSource
        .getRepository(Material)
        .findOneBy({ id: dto.material_id }),
      this.dataSource.getRepository(Ubicacion).findOne({
        where: { id: dto.ubicacion_origen_id },
        relations: { proyecto: true },
      }),
      this.dataSource.getRepository(Ubicacion).findOne({
        where: { id: dto.ubicacion_destino_id },
        relations: { proyecto: true },
      }),
      dto.ruta_acarreo_id
        ? this.dataSource.getRepository(RutaAcarreo).findOne({
            where: { id: dto.ruta_acarreo_id },
            relations: {
              proyecto: true,
              ubicacion_origen: true,
              ubicacion_destino: true,
            },
          })
        : Promise.resolve(null),
    ]);
    if (!proyecto || !material || !origen || !destino)
      throw new BadRequestException(
        'Proyecto, material u ubicaciones no válidos',
      );
    if (
      origen.proyecto.id !== proyecto.id ||
      destino.proyecto.id !== proyecto.id
    )
      throw new BadRequestException(
        'Las ubicaciones deben pertenecer al proyecto',
      );
    if (
      ruta &&
      (ruta.proyecto.id !== proyecto.id ||
        ruta.ubicacion_origen.id !== origen.id ||
        ruta.ubicacion_destino.id !== destino.id)
    ) {
      throw new BadRequestException(
        'La ruta debe coincidir con el proyecto, origen y destino',
      );
    }
    this.normalizarPrecios(dto);
    return {
      proyecto,
      material,
      ubicacion_origen: origen,
      ubicacion_destino: destino,
      ruta_acarreo: ruta,
    };
  }

  private async validarSolapamiento(
    dto: Pick<
      CreateTarifaDto,
      | 'proyecto_id'
      | 'material_id'
      | 'ubicacion_origen_id'
      | 'ubicacion_destino_id'
      | 'vigente_desde'
    > &
      Partial<CreateTarifaDto>,
    excluir: number | null,
  ) {
    const qb = this.repository
      .createQueryBuilder('tarifa')
      .where(
        'tarifa.proyecto_id = :proyecto AND tarifa.material_id = :material AND tarifa.ubicacion_origen_id = :origen AND tarifa.ubicacion_destino_id = :destino AND tarifa.tipo_cobro = :tipo AND tarifa.activo = true',
        {
          proyecto: dto.proyecto_id,
          material: dto.material_id,
          origen: dto.ubicacion_origen_id,
          destino: dto.ubicacion_destino_id,
          tipo: dto.tipo_cobro ?? TipoCobroTarifa.POR_VOLUMEN,
        },
      )
      .andWhere(
        "daterange(tarifa.vigente_desde, COALESCE(tarifa.vigente_hasta, 'infinity'::date), '[]') && daterange(:desde::date, COALESCE(:hasta::date, 'infinity'::date), '[]')",
        { desde: dto.vigente_desde, hasta: dto.vigente_hasta ?? null },
      );
    if (dto.ruta_acarreo_id) {
      qb.andWhere('tarifa.ruta_acarreo_id = :rutaId', {
        rutaId: dto.ruta_acarreo_id,
      });
    } else {
      qb.andWhere('tarifa.ruta_acarreo_id IS NULL');
    }
    if (excluir) qb.andWhere('tarifa.id <> :excluir', { excluir });
    if (await qb.getCount())
      throw new ConflictException(
        'Ya existe una tarifa activa para esa ruta, material y vigencia',
      );
  }

  private normalizarPrecios(dto: Partial<CreateTarifaDto>) {
    const tipo = dto.tipo_cobro ?? TipoCobroTarifa.POR_VOLUMEN;
    if (tipo === TipoCobroTarifa.POR_DISTANCIA_ESCALONADA) {
      if (
        dto.precio_primer_km === undefined ||
        dto.precio_km_subsecuente === undefined
      ) {
        throw new BadRequestException(
          'La tarifa escalonada requiere precio de primer km y subsecuente',
        );
      }
      return {
        precio_unitario: null,
        precio_primer_km: dto.precio_primer_km.toFixed(4),
        precio_km_subsecuente: dto.precio_km_subsecuente.toFixed(4),
      };
    }
    if (dto.precio_unitario === undefined) {
      throw new BadRequestException('La tarifa requiere un precio unitario');
    }
    return {
      precio_unitario: dto.precio_unitario.toFixed(4),
      precio_primer_km: null,
      precio_km_subsecuente: null,
    };
  }
}
