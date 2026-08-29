import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  decimalToScaled,
  multiplyDecimal,
  scaledToDecimal,
} from '../common/decimal.util';
import { Tarifa, TipoCobroTarifa } from '../tarifas/tarifa.entity';
import { EstadoViaje } from '../viajes/enums/estado-viaje.enum';
import { Viaje } from '../viajes/viaje.entity';
import {
  CreateEstimacionDto,
  FacturarEstimacionDto,
  RegistrarPagoEstimacionDto,
} from './dto/estimacion.dto';
import { EstimacionDetalle } from './estimacion-detalle.entity';
import { Estimacion, EstadoEstimacion } from './estimacion.entity';
import { PagoEstimacion } from './pago-estimacion.entity';

@Injectable()
export class EstimacionesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar() {
    const estimaciones = await this.dataSource.getRepository(Estimacion).find({
      relations: { proyecto: true, detalles: true, pagos: true },
      order: { creado_en: 'DESC' },
    });
    return {
      resumen: this.resumenGlobal(estimaciones),
      data: estimaciones.map((item) => this.resumen(item)),
    };
  }

  async obtener(id: number) {
    const estimacion = await this.dataSource.getRepository(Estimacion).findOne({
      where: { id },
      relations: {
        proyecto: true,
        pagos: true,
        detalles: {
          tarifa: true,
          viaje: {
            camion: true,
            chofer: true,
            ubicacion_origen: true,
            ubicacion_destino: true,
          },
        },
      },
      order: { pagos: { fecha: 'DESC' }, detalles: { id: 'ASC' } },
    });
    if (!estimacion)
      throw new NotFoundException(`Estimación con id ${id} no encontrada`);
    return {
      ...this.resumen(estimacion),
      detalles: estimacion.detalles,
      pagos: estimacion.pagos,
    };
  }

  async elegibles(
    proyectoId: number,
    desde: string,
    hasta: string,
    ordenId?: number,
  ) {
    if (desde > hasta) throw new BadRequestException('El periodo no es válido');
    const qb = this.dataSource
      .getRepository(Viaje)
      .createQueryBuilder('viaje')
      .innerJoinAndSelect('viaje.proyecto', 'proyecto')
      .innerJoinAndSelect('viaje.material', 'material')
      .innerJoinAndSelect('viaje.camion', 'camion')
      .innerJoinAndSelect('viaje.chofer', 'chofer')
      .innerJoinAndSelect('viaje.ubicacion_origen', 'origen')
      .innerJoinAndSelect('viaje.ubicacion_destino', 'destino')
      .leftJoin('estimacion_detalles', 'detalle', 'detalle.viaje_id = viaje.id')
      .where('proyecto.id = :proyectoId', { proyectoId })
      .andWhere('viaje.estado = :estado', { estado: EstadoViaje.COMPLETADO })
      .andWhere(
        "viaje.fecha_hora_salida >= :desde::date AND viaje.fecha_hora_salida < (:hasta::date + interval '1 day')",
        { desde, hasta },
      )
      .andWhere('detalle.id IS NULL');
    if (ordenId) qb.andWhere('viaje.orden_acarreo_id = :ordenId', { ordenId });
    return qb.orderBy('viaje.fecha_hora_salida', 'ASC').getMany();
  }

  async crear(dto: CreateEstimacionDto, usuario: AuthUser) {
    if (dto.fecha_desde > dto.fecha_hasta)
      throw new BadRequestException('El periodo no es válido');
    const id = await this.dataSource.transaction(async (manager) => {
      const viajes = await manager
        .getRepository(Viaje)
        .createQueryBuilder('viaje')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('viaje.proyecto', 'proyecto')
        .innerJoinAndSelect('viaje.material', 'material')
        .innerJoinAndSelect('viaje.ubicacion_origen', 'origen')
        .innerJoinAndSelect('viaje.ubicacion_destino', 'destino')
        .where('viaje.id IN (:...ids)', { ids: dto.viaje_ids })
        .getMany();
      if (viajes.length !== dto.viaje_ids.length)
        throw new BadRequestException('Uno o más viajes no existen');
      const duplicados = await manager
        .getRepository(EstimacionDetalle)
        .createQueryBuilder('detalle')
        .where('detalle.viaje_id IN (:...ids)', { ids: dto.viaje_ids })
        .getCount();
      if (duplicados)
        throw new ConflictException(
          'Uno o más viajes ya pertenecen a una estimación',
        );
      const folio = await this.siguienteFolio(manager);
      const estimacion = await manager.save(
        Estimacion,
        manager.create(Estimacion, {
          folio,
          proyecto: { id: dto.proyecto_id },
          fecha_desde: dto.fecha_desde,
          fecha_hasta: dto.fecha_hasta,
          estado: EstadoEstimacion.BORRADOR,
          importe_facturado: null,
          fecha_facturacion: null,
          referencia_factura: null,
          observaciones: dto.observaciones ?? null,
        }),
      );
      for (const viaje of viajes) {
        if (
          viaje.proyecto.id !== dto.proyecto_id ||
          viaje.estado !== EstadoViaje.COMPLETADO
        )
          throw new BadRequestException(
            `El viaje ${viaje.folio} no es elegible`,
          );
        const fecha = viaje.fecha_hora_salida.toISOString().slice(0, 10);
        const tarifa = await this.buscarTarifa(manager, viaje, fecha);
        if (tarifa.precio_unitario === null) {
          throw new BadRequestException(
            `La tarifa del viaje ${viaje.folio} no tiene precio unitario`,
          );
        }
        const cantidad = viaje.cantidad_llegada ?? viaje.cantidad_salida;
        const importe = multiplyDecimal(cantidad, tarifa.precio_unitario);
        await manager.save(
          EstimacionDetalle,
          manager.create(EstimacionDetalle, {
            estimacion,
            viaje,
            tarifa,
            cantidad,
            unidad_medida: viaje.unidad_medida,
            precio_unitario_aplicado: tarifa.precio_unitario,
            importe,
          }),
        );
      }
      return estimacion.id;
    });
    await this.auditoria.registrar({
      usuario,
      accion: 'CREAR_ESTIMACION',
      entidad: 'estimacion',
      entidadId: id,
    });
    return this.obtener(id);
  }

  async cerrar(id: number, usuario: AuthUser) {
    const estimacion = await this.base(id);
    if (estimacion.estado !== EstadoEstimacion.BORRADOR)
      throw new ConflictException(
        'Solo una estimación en borrador puede cerrarse',
      );
    estimacion.estado = EstadoEstimacion.CERRADA;
    await this.dataSource.getRepository(Estimacion).save(estimacion);
    await this.auditoria.registrar({
      usuario,
      accion: 'CERRAR_ESTIMACION',
      entidad: 'estimacion',
      entidadId: id,
    });
    return this.obtener(id);
  }
  async facturar(id: number, dto: FacturarEstimacionDto, usuario: AuthUser) {
    const estimacion = await this.base(id);
    if (
      ![EstadoEstimacion.CERRADA, EstadoEstimacion.FACTURADA].includes(
        estimacion.estado,
      )
    )
      throw new ConflictException(
        'La estimación debe estar cerrada para facturarse',
      );
    estimacion.importe_facturado = dto.importe_facturado.toFixed(2);
    estimacion.fecha_facturacion = dto.fecha_facturacion;
    estimacion.referencia_factura = dto.referencia_factura ?? null;
    estimacion.estado = EstadoEstimacion.FACTURADA;
    await this.dataSource.getRepository(Estimacion).save(estimacion);
    await this.auditoria.registrar({
      usuario,
      accion: 'FACTURAR_ESTIMACION',
      entidad: 'estimacion',
      entidadId: id,
      valorNuevo: { importe_facturado: estimacion.importe_facturado },
    });
    return this.obtener(id);
  }
  async registrarPago(
    id: number,
    dto: RegistrarPagoEstimacionDto,
    usuario: AuthUser,
  ) {
    const estimacion = await this.base(id);
    if (!estimacion.importe_facturado)
      throw new ConflictException('La estimación no está facturada');
    const pagado = estimacion.pagos.reduce(
      (sum, p) => sum + decimalToScaled(p.importe, 2),
      0n,
    );
    const nuevoPago = decimalToScaled(dto.importe, 2);
    const facturado = decimalToScaled(estimacion.importe_facturado, 2);
    if (pagado + nuevoPago > facturado)
      throw new BadRequestException('El pago supera el importe pendiente');
    await this.dataSource.getRepository(PagoEstimacion).save({
      estimacion,
      fecha: dto.fecha,
      importe: scaledToDecimal(nuevoPago, 2),
      referencia: dto.referencia ?? null,
      observaciones: dto.observaciones ?? null,
    });
    if (pagado + nuevoPago === facturado)
      await this.dataSource
        .getRepository(Estimacion)
        .update(id, { estado: EstadoEstimacion.PAGADA });
    await this.auditoria.registrar({
      usuario,
      accion: 'REGISTRAR_PAGO_ESTIMACION',
      entidad: 'estimacion',
      entidadId: id,
      valorNuevo: { importe: scaledToDecimal(nuevoPago, 2) },
    });
    return this.obtener(id);
  }

  private async base(id: number) {
    const item = await this.dataSource
      .getRepository(Estimacion)
      .findOne({ where: { id }, relations: { pagos: true } });
    if (!item)
      throw new NotFoundException(`Estimación con id ${id} no encontrada`);
    return item;
  }
  private resumen(item: Estimacion) {
    const realizado = (item.detalles ?? []).reduce(
      (sum, detalle) => sum + decimalToScaled(detalle.importe, 2),
      0n,
    );
    const cantidad = (item.detalles ?? []).reduce(
      (sum, detalle) => sum + decimalToScaled(detalle.cantidad, 3),
      0n,
    );
    const pagado = (item.pagos ?? []).reduce(
      (sum, pago) => sum + decimalToScaled(pago.importe, 2),
      0n,
    );
    const facturado = decimalToScaled(item.importe_facturado ?? '0', 2);
    return {
      id: item.id,
      folio: item.folio,
      proyecto: item.proyecto,
      fecha_desde: item.fecha_desde,
      fecha_hasta: item.fecha_hasta,
      estado: item.estado,
      viajes: item.detalles?.length ?? 0,
      cantidad: scaledToDecimal(cantidad, 3),
      importe_realizado: scaledToDecimal(realizado, 2),
      importe_facturado: scaledToDecimal(facturado, 2),
      importe_pagado: scaledToDecimal(pagado, 2),
      por_cobrar: scaledToDecimal(
        facturado > pagado ? facturado - pagado : 0n,
        2,
      ),
      fecha_facturacion: item.fecha_facturacion,
      referencia_factura: item.referencia_factura,
      observaciones: item.observaciones,
      creado_en: item.creado_en,
      actualizado_en: item.actualizado_en,
    };
  }
  private resumenGlobal(items: Estimacion[]) {
    const rows = items.map((item) => this.resumen(item));
    const sum = (
      field:
        | 'importe_realizado'
        | 'importe_facturado'
        | 'importe_pagado'
        | 'por_cobrar',
    ) =>
      scaledToDecimal(
        rows.reduce((total, row) => total + decimalToScaled(row[field], 2), 0n),
        2,
      );
    return {
      total_estimaciones: rows.length,
      importe_realizado: sum('importe_realizado'),
      importe_facturado: sum('importe_facturado'),
      importe_pagado: sum('importe_pagado'),
      por_cobrar: sum('por_cobrar'),
    };
  }
  private async buscarTarifa(
    manager: EntityManager,
    viaje: Viaje,
    fecha: string,
  ) {
    const tarifa = await manager
      .getRepository(Tarifa)
      .createQueryBuilder('tarifa')
      .where(
        'tarifa.proyecto_id = :proyecto AND tarifa.material_id = :material AND tarifa.ubicacion_origen_id = :origen AND tarifa.ubicacion_destino_id = :destino AND tarifa.activo = true',
        {
          proyecto: viaje.proyecto.id,
          material: viaje.material.id,
          origen: viaje.ubicacion_origen.id,
          destino: viaje.ubicacion_destino.id,
        },
      )
      .andWhere(
        'tarifa.vigente_desde <= :fecha AND (tarifa.vigente_hasta IS NULL OR tarifa.vigente_hasta >= :fecha)',
        { fecha },
      )
      .orderBy('tarifa.vigente_desde', 'DESC')
      .getOne();
    if (!tarifa)
      throw new BadRequestException(
        `No existe tarifa vigente para el viaje ${viaje.folio}`,
      );
    if (
      tarifa.tipo_cobro !== TipoCobroTarifa.POR_VOLUMEN ||
      tarifa.precio_unitario === null ||
      tarifa.unidad_medida.trim().toLowerCase() !==
        viaje.unidad_medida.trim().toLowerCase()
    )
      throw new BadRequestException(
        `La tarifa del viaje ${viaje.folio} no es compatible`,
      );
    return tarifa;
  }
  private async siguienteFolio(manager: EntityManager) {
    const rows = await manager.query<Array<{ valor: string }>>(
      `SELECT nextval('estimaciones_folio_seq') AS valor`,
    );
    return `EST-${new Date().getFullYear()}-${String(rows[0].valor).padStart(6, '0')}`;
  }
}
