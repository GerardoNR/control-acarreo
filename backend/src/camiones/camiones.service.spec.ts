import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Camion } from './camion.entity';
import { CamionesService } from './camiones.service';

describe('CamionesService - código de ticket de unidad', () => {
  it('permite asignarlo por primera vez', async () => {
    const camion = {
      id: 1,
      codigo_ticket_unidad: null,
      capacidad_m3: '15.00',
    } as Camion;
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(camion),
      save: jest.fn().mockImplementation((valor: Camion) => valor),
    } as unknown as Repository<Camion>;
    const service = new CamionesService(repository);

    await expect(
      service.update(1, { codigo_ticket_unidad: '00142' }),
    ).resolves.toMatchObject({ codigo_ticket_unidad: '00142' });
  });

  it('impide cambiarlo después de asignarlo', async () => {
    const camion = {
      id: 1,
      codigo_ticket_unidad: '00142',
      capacidad_m3: '15.00',
    } as Camion;
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(camion),
    } as unknown as Repository<Camion>;
    const service = new CamionesService(repository);

    await expect(
      service.update(1, { codigo_ticket_unidad: '00143' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
