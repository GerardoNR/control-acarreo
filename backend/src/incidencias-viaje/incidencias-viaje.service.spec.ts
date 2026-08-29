import { EntityManager } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import { TipoIncidenciaViaje } from './incidencia-viaje.entity';
import { IncidenciasViajeService } from './incidencias-viaje.service';

describe('IncidenciasViajeService', () => {
  it('usa la protección idempotente para viaje y tipo automático activo', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const manager = { query } as unknown as EntityManager;
    const service = new IncidenciasViajeService();

    await service.registrarAutomaticas(manager, { id: 'viaje-id' } as Viaje, [
      {
        tipo: TipoIncidenciaViaje.RUTA_NO_CONFIGURADA,
        mensaje: 'Falta ruta',
      },
    ]);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT ("viaje_id", "tipo")'),
      [
        'viaje-id',
        TipoIncidenciaViaje.RUTA_NO_CONFIGURADA,
        'AUTOMATICA',
        'Falta ruta',
        null,
      ],
    );
  });
});
