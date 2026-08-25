import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateChecadorDto } from '../../checadores/dto/create-checador.dto';
import { CreateChoferDto } from '../../choferes/dto/create-chofer.dto';

describe('validación de teléfonos mexicanos', () => {
  it('acepta 10 dígitos en choferes y checadores', async () => {
    const chofer = await validate(
      plainToInstance(CreateChoferDto, {
        nombre: 'José Luis',
        telefono: '8112345678',
      }),
    );
    const checador = await validate(
      plainToInstance(CreateChecadorDto, {
        nombre: 'María José',
        usuario: 'maria',
        password: 'Prueba1234',
        telefono: '8112345678',
      }),
    );
    expect(chofer).toHaveLength(0);
    expect(checador).toHaveLength(0);
  });

  it.each(['81123', '81123456789', '81ABC45678'])(
    'rechaza teléfono inválido: %s',
    async (telefono) => {
      const errores = await validate(
        plainToInstance(CreateChoferDto, { nombre: 'José', telefono }),
      );
      expect(errores.some((error) => error.property === 'telefono')).toBe(true);
    },
  );
});
