import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRutaAcarreoDto } from './ruta-acarreo.dto';

describe('CreateRutaAcarreoDto', () => {
  const valid = {
    proyecto_id: 1,
    clave: 'RUTA-PRUEBA',
    ubicacion_origen_id: 2,
    ubicacion_destino_id: 3,
    distancia_pavimento: 3.5,
    distancia_total: 4.25,
    vigente_desde: '2026-08-28',
  };

  it('acepta distancias decimales no negativas y vigencia', async () => {
    expect(
      await validate(plainToInstance(CreateRutaAcarreoDto, valid)),
    ).toHaveLength(0);
  });

  it('rechaza distancias negativas y más de tres decimales', async () => {
    const errors = await validate(
      plainToInstance(CreateRutaAcarreoDto, {
        ...valid,
        distancia_pavimento: -1.1234,
      }),
    );
    expect(
      errors.some((error) => error.property === 'distancia_pavimento'),
    ).toBe(true);
  });
});
