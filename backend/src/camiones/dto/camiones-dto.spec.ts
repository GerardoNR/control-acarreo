import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCamionDto } from './create-camion.dto';
import { UpdateCamionDto } from './update-camion.dto';

describe('DTO de camiones - capacidad_m3', () => {
  const camionValido = {
    placas: 'ABC-123',
    nfc_tag_uid: '04:A8:35:7B:92:61:80',
    capacidad_m3: 20.25,
  };

  it('permite crear con una capacidad válida', async () => {
    const errores = await validate(
      plainToInstance(CreateCamionDto, camionValido),
    );

    expect(errores).toHaveLength(0);
  });

  it('rechaza crear sin capacidad', async () => {
    const { capacidad_m3, ...sinCapacidad } = camionValido;
    expect(capacidad_m3).toBeDefined();

    const errores = await validate(
      plainToInstance(CreateCamionDto, sinCapacidad),
    );

    expect(errores.some((error) => error.property === 'capacidad_m3')).toBe(
      true,
    );
  });

  it.each([0, -1])(
    'rechaza capacidad no positiva: %s',
    async (capacidad_m3) => {
      const errores = await validate(
        plainToInstance(CreateCamionDto, { ...camionValido, capacidad_m3 }),
      );

      expect(errores.some((error) => error.property === 'capacidad_m3')).toBe(
        true,
      );
    },
  );

  it('respeta escala 2 y el máximo de decimal(10,2)', async () => {
    const conTresDecimales = await validate(
      plainToInstance(CreateCamionDto, {
        ...camionValido,
        capacidad_m3: 20.123,
      }),
    );
    const sobreMaximo = await validate(
      plainToInstance(CreateCamionDto, {
        ...camionValido,
        capacidad_m3: 100_000_000,
      }),
    );

    expect(
      conTresDecimales.some((error) => error.property === 'capacidad_m3'),
    ).toBe(true);
    expect(sobreMaximo.some((error) => error.property === 'capacidad_m3')).toBe(
      true,
    );
  });

  it('permite actualizar sin enviar capacidad', async () => {
    const errores = await validate(
      plainToInstance(UpdateCamionDto, { placas: 'XYZ-987' }),
    );

    expect(errores).toHaveLength(0);
  });
});
