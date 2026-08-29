import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ConsultarViajesDto } from '../viajes/dto/consultar-viajes.dto';
import { Viaje } from '../viajes/viaje.entity';
import { ExcelReportService } from './excel-report.service';
import { ViajeReporteMapper } from './viaje-reporte.mapper';

interface ConteosRaw {
  viajes_totales: string;
  en_transito: string;
  completados: string;
  cancelados: string;
}

interface AgrupacionRaw {
  id: string;
  nombre: string | null;
  viajes_totales: string;
}

interface MaterialRaw extends AgrupacionRaw {
  unidad_medida: string;
  cantidad_transportada: string;
}

interface CamionRaw {
  id: string;
  numero_economico: string | null;
  placas: string;
  viajes_totales: string;
}

@Injectable()
export class ReportesService {
  private readonly viajeReporteMapper = new ViajeReporteMapper();

  constructor(
    @InjectRepository(Viaje)
    private readonly viajesRepository: Repository<Viaje>,
    private readonly excelReportService: ExcelReportService = new ExcelReportService(),
  ) {}

  async resumen() {
    const [conteos, proyectos, materiales, camiones] = await Promise.all([
      this.obtenerConteos(),
      this.obtenerViajesPorProyecto(),
      this.obtenerViajesPorMaterial(),
      this.obtenerViajesPorCamion(),
    ]);

    return {
      viajes_totales: Number(conteos.viajes_totales),
      en_transito: Number(conteos.en_transito),
      completados: Number(conteos.completados),
      cancelados: Number(conteos.cancelados),
      viajes_por_proyecto: proyectos.map((item) => ({
        proyecto_id: Number(item.id),
        nombre: item.nombre,
        viajes_totales: Number(item.viajes_totales),
      })),
      viajes_por_material: materiales.map((item) => ({
        material_id: Number(item.id),
        nombre: item.nombre,
        unidad_medida: item.unidad_medida,
        viajes_totales: Number(item.viajes_totales),
        cantidad_transportada: Number(item.cantidad_transportada),
      })),
      viajes_por_camion: camiones.map((item) => ({
        camion_id: Number(item.id),
        numero_economico: item.numero_economico,
        placas: item.placas,
        viajes_totales: Number(item.viajes_totales),
      })),
    };
  }

  async viajes(filtros: ConsultarViajesDto) {
    const consulta = this.crearConsultaViajes(filtros);
    const [viajes, total] = filtros.todos
      ? await consulta.getManyAndCount()
      : await consulta
          .skip((filtros.page - 1) * filtros.limit)
          .take(filtros.limit)
          .getManyAndCount();
    const effectiveLimit = filtros.todos ? total : filtros.limit;
    return {
      data: viajes.map((viaje) => this.mapearViaje(viaje)),
      meta: {
        page: filtros.page,
        limit: effectiveLimit,
        total,
        total_pages: filtros.todos ? (total > 0 ? 1 : 0) : Math.ceil(total / filtros.limit),
        todos: Boolean(filtros.todos),
      },
    };
  }

  async exportarExcel(filtros: ConsultarViajesDto): Promise<Buffer> {
    const viajes = await this.crearConsultaViajes(filtros).getMany();
    return this.excelReportService.generar(
      viajes.map((viaje) => this.viajeReporteMapper.toRow(viaje)),
    );
  }

  private crearConsultaViajes(
    filtros: ConsultarViajesDto,
  ): SelectQueryBuilder<Viaje> {
    const qb = this.viajesRepository
      .createQueryBuilder('viaje')
      .innerJoinAndSelect('viaje.proyecto', 'proyecto')
      .leftJoinAndSelect('viaje.orden_acarreo', 'orden')
      .innerJoinAndSelect('viaje.material', 'material')
      .innerJoinAndSelect('viaje.camion', 'camion')
      .innerJoinAndSelect('viaje.chofer', 'chofer')
      .innerJoinAndSelect('viaje.ubicacion_origen', 'origen')
      .innerJoinAndSelect('viaje.ubicacion_destino', 'destino')
      .innerJoinAndSelect('viaje.checador_salida', 'checadorSalida')
      .leftJoinAndSelect('viaje.checador_llegada', 'checadorLlegada')
      .leftJoinAndSelect('viaje.checador_origen', 'checadorOrigen')
      .leftJoinAndSelect('viaje.checador_destino', 'checadorDestino')
      .leftJoinAndSelect('viaje.incidencias', 'incidencia')
      .orderBy('viaje.fecha_hora_salida', 'DESC')
      .addOrderBy('viaje.id', 'DESC');
    if (filtros.folio)
      qb.andWhere('viaje.folio ILIKE :folio', { folio: `%${filtros.folio}%` });
    if (filtros.estado)
      qb.andWhere('viaje.estado = :estado', { estado: filtros.estado });
    if (filtros.proyecto_id)
      qb.andWhere('proyecto.id = :proyectoId', {
        proyectoId: filtros.proyecto_id,
      });
    if (filtros.material_id)
      qb.andWhere('material.id = :materialId', {
        materialId: filtros.material_id,
      });
    if (filtros.camion_id)
      qb.andWhere('camion.id = :camionId', { camionId: filtros.camion_id });
    if (filtros.chofer_id)
      qb.andWhere('chofer.id = :choferId', { choferId: filtros.chofer_id });
    if (filtros.ubicacion_origen_id)
      qb.andWhere('origen.id = :origenId', {
        origenId: filtros.ubicacion_origen_id,
      });
    if (filtros.ubicacion_destino_id)
      qb.andWhere('destino.id = :destinoId', {
        destinoId: filtros.ubicacion_destino_id,
      });
    if (filtros.fecha_desde)
      qb.andWhere(
        "viaje.fecha_hora_salida >= (:fechaDesde::date AT TIME ZONE 'America/Monterrey')",
        { fechaDesde: filtros.fecha_desde },
      );
    if (filtros.fecha_hasta)
      qb.andWhere(
        "viaje.fecha_hora_salida < ((:fechaHasta::date + 1) AT TIME ZONE 'America/Monterrey')",
        { fechaHasta: filtros.fecha_hasta },
      );
    return qb;
  }

  private mapearViaje(viaje: Viaje) {
    return {
      id: viaje.id,
      folio: viaje.folio,
      fecha_hora_salida: viaje.fecha_hora_salida,
      fecha_hora_llegada: viaje.fecha_hora_llegada,
      proyecto: { id: viaje.proyecto.id, nombre: viaje.proyecto.nombre },
      camion: {
        id: viaje.camion.id,
        numero_economico: viaje.camion.numero_economico,
        placas: viaje.camion.placas,
      },
      chofer: { id: viaje.chofer.id, nombre: this.nombreChofer(viaje) },
      ubicacion_origen: {
        id: viaje.ubicacion_origen.id,
        nombre: viaje.ubicacion_origen.nombre,
        tipo: viaje.ubicacion_origen.tipo,
      },
      ubicacion_destino: {
        id: viaje.ubicacion_destino.id,
        nombre: viaje.ubicacion_destino.nombre,
        tipo: viaje.ubicacion_destino.tipo,
      },
      material: { id: viaje.material.id, nombre: viaje.material.nombre },
      cantidad_salida: viaje.cantidad_salida,
      cantidad_llegada: viaje.cantidad_llegada,
      unidad_medida: viaje.unidad_medida,
      estado: viaje.estado,
      checador_salida: {
        id: viaje.checador_salida.id,
        nombre: viaje.checador_salida.nombre,
      },
      checador_llegada: viaje.checador_llegada
        ? {
            id: viaje.checador_llegada.id,
            nombre: viaje.checador_llegada.nombre,
          }
        : null,
      orden_acarreo: viaje.orden_acarreo
        ? { id: viaje.orden_acarreo.id, folio: viaje.orden_acarreo.folio }
        : null,
    };
  }

  private nombreChofer(viaje: Viaje) {
    return [
      viaje.chofer.nombre,
      viaje.chofer.apellido_paterno,
      viaje.chofer.apellido_materno,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private obtenerConteos(): Promise<ConteosRaw> {
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .select('COUNT(*)', 'viajes_totales')
      .addSelect(
        `COUNT(*) FILTER (WHERE viaje.estado = 'en_transito')`,
        'en_transito',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE viaje.estado = 'completado')`,
        'completados',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE viaje.estado = 'cancelado')`,
        'cancelados',
      )
      .getRawOne<ConteosRaw>() as Promise<ConteosRaw>;
  }

  private obtenerViajesPorProyecto(): Promise<AgrupacionRaw[]> {
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .innerJoin('viaje.proyecto', 'proyecto')
      .select('proyecto.id', 'id')
      .addSelect('proyecto.nombre', 'nombre')
      .addSelect('COUNT(*)', 'viajes_totales')
      .groupBy('proyecto.id')
      .addGroupBy('proyecto.nombre')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<AgrupacionRaw>();
  }

  private obtenerViajesPorMaterial(): Promise<MaterialRaw[]> {
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .innerJoin('viaje.material', 'material')
      .select('material.id', 'id')
      .addSelect('material.nombre', 'nombre')
      .addSelect('viaje.unidad_medida', 'unidad_medida')
      .addSelect('COUNT(*)', 'viajes_totales')
      .addSelect(
        `COALESCE(SUM(viaje.cantidad_llegada) FILTER (WHERE viaje.estado = 'completado'), 0)`,
        'cantidad_transportada',
      )
      .groupBy('material.id')
      .addGroupBy('material.nombre')
      .addGroupBy('viaje.unidad_medida')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<MaterialRaw>();
  }

  private obtenerViajesPorCamion(): Promise<CamionRaw[]> {
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .innerJoin('viaje.camion', 'camion')
      .select('camion.id', 'id')
      .addSelect('camion.numero_economico', 'numero_economico')
      .addSelect('camion.placas', 'placas')
      .addSelect('COUNT(*)', 'viajes_totales')
      .groupBy('camion.id')
      .addGroupBy('camion.numero_economico')
      .addGroupBy('camion.placas')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<CamionRaw>();
  }
}
