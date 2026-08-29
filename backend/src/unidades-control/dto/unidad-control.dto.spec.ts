import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUnidadControlDto } from './unidad-control.dto';

describe('CreateUnidadControlDto', () => {
  it('acepta una unidad configurada por proyecto', async () => {
    const dto = plainToInstance(CreateUnidadControlDto, {
      proyecto_id: 1,
      nombre: 'Unidad de prueba',
      descripcion: 'Configuración administrable',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rechaza un nombre vacío', async () => {
    const dto = plainToInstance(CreateUnidadControlDto, {
      proyecto_id: 1,
      nombre: '   ',
    });
    expect(
      (await validate(dto)).some((error) => error.property === 'nombre'),
    ).toBe(true);
  });
});
