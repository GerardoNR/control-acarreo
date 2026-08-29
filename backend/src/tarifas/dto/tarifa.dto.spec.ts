import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoCobroTarifa } from '../tarifa.entity';
import { CreateTarifaDto } from './tarifa.dto';

const base = {
  proyecto_id: 1,
  material_id: 2,
  ubicacion_origen_id: 3,
  ubicacion_destino_id: 4,
  vigente_desde: '2026-08-28',
};

describe('CreateTarifaDto', () => {
  it('conserva la modalidad POR_VOLUMEN con precio unitario', async () => {
    const errores = await validate(
      plainToInstance(CreateTarifaDto, {
        ...base,
        tipo_cobro: TipoCobroTarifa.POR_VOLUMEN,
        precio_unitario: 125.5,
      }),
    );

    expect(errores).toHaveLength(0);
  });

  it('acepta precios de cuatro decimales para distancia escalonada', async () => {
    const errores = await validate(
      plainToInstance(CreateTarifaDto, {
        ...base,
        ruta_acarreo_id: 7,
        tipo_cobro: TipoCobroTarifa.POR_DISTANCIA_ESCALONADA,
        precio_primer_km: 12.1234,
        precio_km_subsecuente: 5.4321,
      }),
    );

    expect(errores).toHaveLength(0);
  });

  it('rechaza una tarifa escalonada incompleta', async () => {
    const errores = await validate(
      plainToInstance(CreateTarifaDto, {
        ...base,
        tipo_cobro: TipoCobroTarifa.POR_DISTANCIA_ESCALONADA,
        precio_primer_km: 12,
      }),
    );

    expect(
      errores.some((error) => error.property === 'precio_km_subsecuente'),
    ).toBe(true);
  });
});
