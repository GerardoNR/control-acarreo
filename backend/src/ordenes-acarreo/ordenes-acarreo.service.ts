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
import { Tarifa } from '../tarifas/tarifa.entity';
import { UnidadControl } from '../unidades-control/unidad-control.entity';
import { EstadoViaje } from '../viajes/enums/estado-viaje.enum';
import { Viaje } from '../viajes/viaje.entity';
import {
  ConsultarOrdenesDto,
  CreateOrdenAcarreoDto,
  UpdateOrdenAcarreoDto,
} from './dto/orden-acarreo.dto';
import { EstadoOrdenAcarreo, OrdenAcarreo } from './orden-acarreo.entity';

interface ResumenOrdenRaw {
  transportado: string;
  viajes_completados: string;
}

@Injectable()
export class OrdenesAcarreoService {
  constructor(
    @InjectRepository(OrdenAcarreo)
    private readonly repository: Repository<OrdenAcarreo>,
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar(filtros: ConsultarOrdenesDto) {
    const qb = this.repository
      .createQueryBuilder('orden')
      .innerJoinAndSelect('orden.proyecto', 'proyecto')
      .innerJoinAndSelect('orden.material', 'material')
      .innerJoinAndSelect('orden.ubicacion_origen', 'origen')
      .innerJoinAndSelect('orden.ubicacion_destino', 'destino')
      .leftJoinAndSelect('orden.ruta_acarreo', 'ruta')
      .leftJoinAndSelect('orden.unidad_control', 'unidadControl')
      .leftJoinAndSelect('orden.tarifa', 'tarifa')
      .leftJoin(
        'viajes',
        'viaje',
        'viaje.orden_acarreo_id = orden.id AND viaje.estado = :completado',
        { completado: EstadoViaje.COMPLETADO },
      )
      .addSelect('COUNT(viaje.id)', 'viajes_completados')
      .addSelect(
        'COALESCE(SUM(COALESCE(viaje.cantidad_llegada, viaje.cantidad_salida)), 0)',
        'transportado',
      )
      .groupBy('orden.id')
      .addGroupBy('proyecto.id')
      .addGroupBy('material.id')
      .addGroupBy('origen.id')
      .addGroupBy('destino.id')
      .addGroupBy('ruta.id')
      .addGroupBy('unidadControl.id')
      .addGroupBy('tarifa.id')
      .orderBy('orden.creado_en', 'DESC');
    if (filtros.buscar)
      qb.andWhere(
        '(orden.folio ILIKE :buscar OR proyecto.nombre ILIKE :buscar OR material.nombre ILIKE :buscar)',
        { buscar: `%${filtros.buscar}%` },
      );
    if (filtros.proyecto_id)
      qb.andWhere('proyecto.id = :proyectoId', {
        proyectoId: filtros.proyecto_id,
      });
    if (filtros.material_id)
      qb.andWhere('material.id = :materialId', {
        materialId: filtros.material_id,
      });
    if (filtros.desde)
      qb.andWhere('orden.fecha_inicio >= :desde', { desde: filtros.desde });
    if (filtros.hasta)
      qb.andWhere('orden.fecha_inicio <= :hasta', { hasta: filtros.hasta });
    const { entities, raw } = await qb.getRawAndEntities<ResumenOrdenRaw>();
    const items = entities.map((orden, index) =>
      this.resumen(
        orden,
        raw[index]?.transportado ?? '0',
        raw[index]?.viajes_completados ?? '0',
      ),
    );
    return filtros.estado
      ? items.filter((item) => item.estado === filtros.estado)
      : items;
  }

  async obtener(id: number) {
    const orden = await this.repository.findOne({
      where: { id },
      relations: {
        proyecto: true,
        material: true,
        ubicacion_origen: true,
        ubicacion_destino: true,
        ruta_acarreo: true,
        unidad_control: true,
        tarifa: true,
      },
    });
    if (!orden)
      throw new NotFoundException(
        `Orden de acarreo con id ${id} no encontrada`,
      );
    const viajes = await this.dataSource.getRepository(Viaje).find({
      where: { orden_acarreo: { id } },
      relations: { camion: true, chofer: true },
      order: { fecha_hora_salida: 'DESC' },
    });
    const completados = viajes.filter(
      (viaje) => viaje.estado === EstadoViaje.COMPLETADO,
    );
    const transportado = completados.reduce(
      (total, viaje) =>
        total + Number(viaje.cantidad_llegada ?? viaje.cantidad_salida),
      0,
    );
    return {
      ...this.resumen(
        orden,
        transportado.toFixed(3),
        completados.length.toString(),
      ),
      viajes: viajes.map((viaje) => ({
        id: viaje.id,
        folio: viaje.folio,
        camion: viaje.camion,
        chofer: viaje.chofer,
        cantidad: viaje.cantidad_llegada ?? viaje.cantidad_salida,
        unidad_medida: viaje.unidad_medida,
        fecha_hora_salida: viaje.fecha_hora_salida,
        fecha_hora_llegada: viaje.fecha_hora_llegada,
        estado: viaje.estado,
      })),
    };
  }

  async crear(dto: CreateOrdenAcarreoDto, usuario: AuthUser) {
    const refs = await this.validarReferencias(dto);
    const folio = await this.siguienteFolio();
    const orden = await this.repository.save(
      this.repository.create({
        ...refs,
        folio,
        cantidad_solicitada: dto.cantidad_solicitada.toFixed(3),
        unidad_medida: refs.material.unidad_medida,
        fecha_inicio: dto.fecha_inicio,
        fecha_fin: dto.fecha_fin ?? null,
        observaciones: dto.observaciones ?? null,
        estado: EstadoOrdenAcarreo.PENDIENTE,
      }),
    );
    await this.auditoria.registrar({
      usuario,
      accion: 'CREAR_ORDEN_ACARREO',
      entidad: 'orden_acarreo',
      entidadId: orden.id,
      valorNuevo: { folio },
    });
    return this.obtener(orden.id);
  }

  async editar(id: number, dto: UpdateOrdenAcarreoDto, usuario: AuthUser) {
    const actual = await this.repository.findOne({
      where: { id },
      relations: {
        proyecto: true,
        material: true,
        ubicacion_origen: true,
        ubicacion_destino: true,
        ruta_acarreo: true,
        unidad_control: true,
        tarifa: true,
      },
    });
    if (!actual)
      throw new NotFoundException(
        `Orden de acarreo con id ${id} no encontrada`,
      );
    if (actual.estado === EstadoOrdenAcarreo.CANCELADA)
      throw new ConflictException('Una orden cancelada no puede editarse');
    const viajes = await this.dataSource
      .getRepository(Viaje)
      .count({ where: { orden_acarreo: { id } } });
    const cambiaRuta =
      dto.proyecto_id !== undefined ||
      dto.material_id !== undefined ||
      dto.ubicacion_origen_id !== undefined ||
      dto.ubicacion_destino_id !== undefined ||
      dto.ruta_acarreo_id !== undefined ||
      dto.unidad_control_id !== undefined ||
      dto.tarifa_id !== undefined;
    if (viajes > 0 && cambiaRuta)
      throw new ConflictException(
        'No puede cambiarse la ruta o material de una orden con viajes',
      );
    if (cambiaRuta)
      Object.assign(
        actual,
        await this.validarReferencias({
          proyecto_id: dto.proyecto_id ?? actual.proyecto.id,
          material_id: dto.material_id ?? actual.material.id,
          ubicacion_origen_id:
            dto.ubicacion_origen_id ?? actual.ubicacion_origen.id,
          ubicacion_destino_id:
            dto.ubicacion_destino_id ?? actual.ubicacion_destino.id,
          ruta_acarreo_id:
            dto.ruta_acarreo_id ?? actual.ruta_acarreo?.id ?? undefined,
          unidad_control_id:
            dto.unidad_control_id ?? actual.unidad_control?.id ?? undefined,
          tarifa_id: dto.tarifa_id ?? actual.tarifa?.id ?? undefined,
          cantidad_solicitada:
            dto.cantidad_solicitada ?? Number(actual.cantidad_solicitada),
          fecha_inicio: dto.fecha_inicio ?? actual.fecha_inicio,
        }),
      );
    if (dto.cantidad_solicitada !== undefined)
      actual.cantidad_solicitada = dto.cantidad_solicitada.toFixed(3);
    if (dto.fecha_inicio !== undefined) actual.fecha_inicio = dto.fecha_inicio;
    if (dto.fecha_fin !== undefined) actual.fecha_fin = dto.fecha_fin;
    if (dto.observaciones !== undefined)
      actual.observaciones = dto.observaciones;
    await this.repository.save(actual);
    await this.auditoria.registrar({
      usuario,
      accion: 'EDITAR_ORDEN_ACARREO',
      entidad: 'orden_acarreo',
      entidadId: id,
    });
    return this.obtener(id);
  }

  async cancelar(id: number, usuario: AuthUser) {
    const orden = await this.repository.findOneBy({ id });
    if (!orden)
      throw new NotFoundException(
        `Orden de acarreo con id ${id} no encontrada`,
      );
    if (orden.estado === EstadoOrdenAcarreo.CANCELADA)
      throw new ConflictException('La orden ya está cancelada');
    orden.estado = EstadoOrdenAcarreo.CANCELADA;
    await this.repository.save(orden);
    await this.auditoria.registrar({
      usuario,
      accion: 'CANCELAR_ORDEN_ACARREO',
      entidad: 'orden_acarreo',
      entidadId: id,
    });
    return this.obtener(id);
  }

  private resumen(
    orden: OrdenAcarreo,
    transportadoRaw: string,
    viajesRaw: string,
  ) {
    const solicitado = Number(orden.cantidad_solicitada);
    const transportado = Number(transportadoRaw);
    const diferencia = solicitado - transportado;
    const estadoCalculado =
      orden.estado === EstadoOrdenAcarreo.CANCELADA
        ? orden.estado
        : transportado >= solicitado
          ? EstadoOrdenAcarreo.COMPLETADA
          : transportado > 0
            ? EstadoOrdenAcarreo.EN_PROCESO
            : EstadoOrdenAcarreo.PENDIENTE;
    return {
      ...orden,
      estado: estadoCalculado,
      transportado: transportado.toFixed(3),
      pendiente: Math.max(diferencia, 0).toFixed(3),
      excedente: Math.max(-diferencia, 0).toFixed(3),
      avance_porcentaje:
        solicitado > 0
          ? Number(((transportado / solicitado) * 100).toFixed(2))
          : 0,
      viajes_completados: Number(viajesRaw),
    };
  }

  private async validarReferencias(
    dto: Pick<
      CreateOrdenAcarreoDto,
      | 'proyecto_id'
      | 'material_id'
      | 'ubicacion_origen_id'
      | 'ubicacion_destino_id'
      | 'fecha_inicio'
    > &
      Partial<CreateOrdenAcarreoDto>,
  ) {
    if (dto.ubicacion_origen_id === dto.ubicacion_destino_id)
      throw new BadRequestException('Origen y destino deben ser diferentes');
    const [proyecto, material, origen, destino, ruta, unidadControl, tarifa] =
      await Promise.all([
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
        dto.unidad_control_id
          ? this.dataSource.getRepository(UnidadControl).findOne({
              where: { id: dto.unidad_control_id },
              relations: { proyecto: true },
            })
          : Promise.resolve(null),
        dto.tarifa_id
          ? this.dataSource.getRepository(Tarifa).findOne({
              where: { id: dto.tarifa_id },
              relations: {
                proyecto: true,
                material: true,
                ubicacion_origen: true,
                ubicacion_destino: true,
                ruta_acarreo: true,
              },
            })
          : Promise.resolve(null),
      ]);
    if (!proyecto || !material || !origen || !destino)
      throw new BadRequestException(
        'Proyecto, material u ubicaciones no válidos',
      );
    if (
      !proyecto.activo ||
      !material.activo ||
      !origen.activo ||
      !destino.activo ||
      (ruta !== null && !ruta.activo) ||
      (unidadControl !== null && !unidadControl.activo) ||
      (tarifa !== null && !tarifa.activo)
    )
      throw new BadRequestException(
        'Todos los catálogos de la orden deben estar activos',
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
        'La ruta debe coincidir con el proyecto, origen y destino de la orden',
      );
    }
    if (unidadControl && unidadControl.proyecto.id !== proyecto.id) {
      throw new BadRequestException(
        'La unidad de control debe pertenecer al proyecto',
      );
    }
    if (
      tarifa &&
      (tarifa.proyecto.id !== proyecto.id ||
        tarifa.material.id !== material.id ||
        tarifa.ubicacion_origen.id !== origen.id ||
        tarifa.ubicacion_destino.id !== destino.id ||
        (tarifa.ruta_acarreo !== null && tarifa.ruta_acarreo.id !== ruta?.id))
    ) {
      throw new BadRequestException(
        'La tarifa debe coincidir con el proyecto, material y ruta de la orden',
      );
    }
    return {
      proyecto,
      material,
      ubicacion_origen: origen,
      ubicacion_destino: destino,
      ruta_acarreo: ruta,
      unidad_control: unidadControl,
      tarifa,
    };
  }

  private async siguienteFolio() {
    const rows = await this.dataSource.query<Array<{ valor: string }>>(
      `SELECT nextval('ordenes_acarreo_folio_seq') AS valor`,
    );
    return `ORD-${new Date().getFullYear()}-${String(rows[0].valor).padStart(6, '0')}`;
  }
}
