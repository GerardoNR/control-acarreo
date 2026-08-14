import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';

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
  constructor(
    @InjectRepository(Viaje)
    private readonly viajesRepository: Repository<Viaje>,
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
