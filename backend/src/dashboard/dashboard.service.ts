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
}

interface VolumenRaw {
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

    const [conteos, volumenes] = await Promise.all([
      this.obtenerConteos(inicio, fin),
      this.obtenerVolumenes(inicio, fin),
    ]);

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
}
