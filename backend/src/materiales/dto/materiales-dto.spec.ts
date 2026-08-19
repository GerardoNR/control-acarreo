import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMaterialDto } from './create-material.dto';
import { UpdateMaterialDto } from './update-material.dto';

describe('DTO de materiales - unidad_medida', () => {
  it('permite crear con una unidad válida y la recorta', async () => {
    const dto = plainToInstance(CreateMaterialDto, {
      nombre: 'Arena',
      unidad_medida: '  m3  ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.unidad_medida).toBe('m3');
  });

  it.each(['', '   '])('rechaza crear con unidad vacía: %j', async (unidad) => {
    const errores = await validate(
      plainToInstance(CreateMaterialDto, {
        nombre: 'Arena',
        unidad_medida: unidad,
      }),
    );

    expect(errores.some((error) => error.property === 'unidad_medida')).toBe(
      true,
    );
  });

  it('permite actualizar sin enviar unidad', async () => {
    const errores = await validate(
      plainToInstance(UpdateMaterialDto, { descripcion: 'Actualizada' }),
    );

    expect(errores).toHaveLength(0);
  });

  it.each(['', '   '])(
    'rechaza actualizar con unidad vacía: %j',
    async (unidad) => {
      const errores = await validate(
        plainToInstance(UpdateMaterialDto, { unidad_medida: unidad }),
      );

      expect(errores.some((error) => error.property === 'unidad_medida')).toBe(
        true,
      );
    },
  );
});
