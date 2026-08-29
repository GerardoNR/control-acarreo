import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoViaje } from '../viajes/enums/estado-viaje.enum';
import { Viaje } from '../viajes/viaje.entity';
import {
  formatearFechaOperativa,
  inicioDiaOperativo,
  sumarDiasFechaSimple,
  ZONA_HORARIA_OPERATIVA,
} from '../viajes/viajes.constants';

interface ConteosRaw {
  viajes_hoy: string;
  en_transito: string;
  completados_hoy: string;
  cancelados_hoy: string;
  camiones_operando: string;
  proyectos_activos: string;
}

interface VolumenRaw {
  unidad_medida: string;
  cantidad: string;
}

interface ActividadRaw {
  fecha: string;
  cantidad: string;
}
interface VolumenPeriodoRaw {
  fecha: string;
  unidad_medida: string;
  cantidad: string;
}

export interface DashboardResumenResponse {
  fecha_operativa: string;
  zona_horaria: string;
  viajes_hoy: number;
  en_transito: number;
  completados_hoy: number;
  cancelados_hoy: number;
  volumen_transportado: Array<{
    unidad_medida: string;
    cantidad: number;
  }>;
  actividad_ultimos_7_dias: Array<{
    fecha: string;
    salidas: number;
    completados: number;
    cancelados: number;
  }>;
  volumen_ultimos_7_dias: Array<{
    fecha: string;
    unidad_medida: string;
    cantidad: number;
  }>;
  operacion_actual: {
    viajes_en_transito: number;
    camiones_operando: number;
    proyectos_activos: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Viaje)
    private readonly viajesRepository: Repository<Viaje>,
  ) {}

  async resumen(ahora = new Date()): Promise<DashboardResumenResponse> {
    const fechaCompacta = formatearFechaOperativa(ahora);
    const fechaOperativa = `${fechaCompacta.slice(0, 4)}-${fechaCompacta.slice(4, 6)}-${fechaCompacta.slice(6, 8)}`;
    const inicio = inicioDiaOperativo(fechaOperativa);
    const fin = inicioDiaOperativo(sumarDiasFechaSimple(fechaOperativa, 1));

    const fechaInicio = sumarDiasFechaSimple(fechaOperativa, -6);
    const fechas = Array.from({ length: 7 }, (_, indice) =>
      sumarDiasFechaSimple(fechaInicio, indice),
    );
    const inicioPeriodo = inicioDiaOperativo(fechaInicio);
    const [
      conteos,
      volumenes,
      salidas,
      completados,
      cancelados,
      volumenPeriodo,
    ] = await Promise.all([
      this.obtenerConteos(inicio, fin),
      this.obtenerVolumenes(inicio, fin),
      this.obtenerActividad('fecha_hora_salida', inicioPeriodo, fin),
      this.obtenerActividad('fecha_hora_llegada', inicioPeriodo, fin, true),
      this.obtenerActividad('fecha_hora_cancelacion', inicioPeriodo, fin),
      this.obtenerVolumenPeriodo(inicioPeriodo, fin),
    ]);
    const porFecha = new Map(
      fechas.map((fecha) => [
        fecha,
        { fecha, salidas: 0, completados: 0, cancelados: 0 },
      ]),
    );
    salidas.forEach((item) => {
      const dia = porFecha.get(item.fecha);
      if (dia) dia.salidas = Number(item.cantidad);
    });
    completados.forEach((item) => {
      const dia = porFecha.get(item.fecha);
      if (dia) dia.completados = Number(item.cantidad);
    });
    cancelados.forEach((item) => {
      const dia = porFecha.get(item.fecha);
      if (dia) dia.cancelados = Number(item.cantidad);
    });

    return {
      fecha_operativa: fechaOperativa,
      zona_horaria: ZONA_HORARIA_OPERATIVA,
      viajes_hoy: Number(conteos.viajes_hoy),
      en_transito: Number(conteos.en_transito),
      completados_hoy: Number(conteos.completados_hoy),
      cancelados_hoy: Number(conteos.cancelados_hoy),
      volumen_transportado: volumenes.map((volumen) => ({
        unidad_medida: volumen.unidad_medida,
        cantidad: Number(volumen.cantidad),
      })),
      actividad_ultimos_7_dias: fechas.map((fecha) => porFecha.get(fecha)!),
      volumen_ultimos_7_dias: volumenPeriodo.map((item) => ({
        fecha: item.fecha,
        unidad_medida: item.unidad_medida,
        cantidad: Number(item.cantidad),
      })),
      operacion_actual: {
        viajes_en_transito: Number(conteos.en_transito),
        camiones_operando: Number(conteos.camiones_operando),
        proyectos_activos: Number(conteos.proyectos_activos),
      },
    };
  }

  private obtenerConteos(inicio: Date, fin: Date): Promise<ConteosRaw> {
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .select(
        'COUNT(*) FILTER (WHERE viaje.fecha_hora_salida >= :inicio AND viaje.fecha_hora_salida < :fin)',
        'viajes_hoy',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE viaje.estado = :enTransito)',
        'en_transito',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE viaje.estado = :completado AND viaje.fecha_hora_llegada >= :inicio AND viaje.fecha_hora_llegada < :fin)',
        'completados_hoy',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE viaje.estado = :cancelado AND viaje.fecha_hora_cancelacion >= :inicio AND viaje.fecha_hora_cancelacion < :fin)',
        'cancelados_hoy',
      )
      .addSelect(
        'COUNT(DISTINCT viaje.camion_id) FILTER (WHERE viaje.estado = :enTransito)',
        'camiones_operando',
      )
      .addSelect(
        'COUNT(DISTINCT viaje.proyecto_id) FILTER (WHERE viaje.estado = :enTransito)',
        'proyectos_activos',
      )
      .setParameters({
        inicio,
        fin,
        enTransito: EstadoViaje.EN_TRANSITO,
        completado: EstadoViaje.COMPLETADO,
        cancelado: EstadoViaje.CANCELADO,
      })
      .getRawOne<ConteosRaw>() as Promise<ConteosRaw>;
  }

  private obtenerVolumenes(inicio: Date, fin: Date): Promise<VolumenRaw[]> {
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .select('viaje.unidad_medida', 'unidad_medida')
      .addSelect('COALESCE(SUM(viaje.cantidad_llegada), 0)', 'cantidad')
      .where('viaje.estado = :completado', {
        completado: EstadoViaje.COMPLETADO,
      })
      .andWhere('viaje.fecha_hora_llegada >= :inicio', { inicio })
      .andWhere('viaje.fecha_hora_llegada < :fin', { fin })
      .andWhere('viaje.cantidad_llegada IS NOT NULL')
      .groupBy('viaje.unidad_medida')
      .orderBy('viaje.unidad_medida', 'ASC')
      .getRawMany<VolumenRaw>();
  }

  private obtenerActividad(
    campo:
      'fecha_hora_salida' | 'fecha_hora_llegada' | 'fecha_hora_cancelacion',
    inicio: Date,
    fin: Date,
    completado = false,
  ): Promise<ActividadRaw[]> {
    const fecha = `TO_CHAR(viaje.${campo} AT TIME ZONE :zona, 'YYYY-MM-DD')`;
    const query = this.viajesRepository
      .createQueryBuilder('viaje')
      .select(fecha, 'fecha')
      .addSelect('COUNT(*)', 'cantidad')
      .where(`viaje.${campo} >= :inicio`, { inicio })
      .andWhere(`viaje.${campo} < :fin`, { fin });
    if (completado)
      query.andWhere('viaje.estado = :completado', {
        completado: EstadoViaje.COMPLETADO,
      });
    return query
      .setParameters({ zona: ZONA_HORARIA_OPERATIVA })
      .groupBy(fecha)
      .orderBy(fecha, 'ASC')
      .getRawMany<ActividadRaw>();
  }

  private obtenerVolumenPeriodo(
    inicio: Date,
    fin: Date,
  ): Promise<VolumenPeriodoRaw[]> {
    const fecha =
      "TO_CHAR(viaje.fecha_hora_llegada AT TIME ZONE :zona, 'YYYY-MM-DD')";
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .select(fecha, 'fecha')
      .addSelect('viaje.unidad_medida', 'unidad_medida')
      .addSelect('COALESCE(SUM(viaje.cantidad_llegada), 0)', 'cantidad')
      .where('viaje.estado = :completado', {
        completado: EstadoViaje.COMPLETADO,
      })
      .andWhere('viaje.fecha_hora_llegada >= :inicio', { inicio })
      .andWhere('viaje.fecha_hora_llegada < :fin', { fin })
      .andWhere('viaje.cantidad_llegada IS NOT NULL')
      .setParameters({ zona: ZONA_HORARIA_OPERATIVA })
      .groupBy(fecha)
      .addGroupBy('viaje.unidad_medida')
      .orderBy(fecha, 'ASC')
      .addOrderBy('viaje.unidad_medida', 'ASC')
      .getRawMany<VolumenPeriodoRaw>();
  }
}
