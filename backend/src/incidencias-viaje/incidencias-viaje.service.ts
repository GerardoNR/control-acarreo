import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import {
  OrigenIncidenciaViaje,
  TipoIncidenciaViaje,
} from './incidencia-viaje.entity';

export interface NuevaIncidenciaAutomatica {
  tipo: TipoIncidenciaViaje;
  mensaje: string;
  datos?: Record<string, unknown>;
}

@Injectable()
export class IncidenciasViajeService {
  async registrarAutomaticas(
    manager: EntityManager,
    viaje: Viaje,
    incidencias: NuevaIncidenciaAutomatica[],
  ): Promise<void> {
    if (incidencias.length === 0) return;

    for (const incidencia of incidencias) {
      await manager.query(
        `INSERT INTO "incidencias_viaje"
          ("viaje_id", "tipo", "origen", "mensaje", "datos", "activa", "detectada_en")
         VALUES ($1, $2, $3, $4, $5::jsonb, true, NOW())
         ON CONFLICT ("viaje_id", "tipo")
           WHERE "origen" = 'AUTOMATICA' AND "activa" = true
         DO NOTHING`,
        [
          viaje.id,
          incidencia.tipo,
          OrigenIncidenciaViaje.AUTOMATICA,
          incidencia.mensaje,
          incidencia.datos ? JSON.stringify(incidencia.datos) : null,
        ],
      );
    }
  }
}
