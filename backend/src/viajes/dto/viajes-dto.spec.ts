import { ArgumentMetadata, Type, ValidationPipe } from '@nestjs/common';
import { CancelarViajeDto } from './cancelar-viaje.dto';
import { ConsultarViajesDto } from './consultar-viajes.dto';
import { RegistrarLlegadaViajeDto } from './registrar-llegada-viaje.dto';
import { RegistrarSalidaViajeDto } from './registrar-salida-viaje.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

function validate<T extends object>(
  metatype: Type<T>,
  value: Record<string, unknown>,
  type: ArgumentMetadata['type'] = 'body',
): Promise<T> {
  return validationPipe.transform(value, { metatype, type });
}

const salidaValida = {
  proyecto_id: 1,
  material_id: 2,
  camion_id: 3,
  chofer_id: 4,
  ubicacion_origen_id: 5,
  ubicacion_destino_id: 6,
  cantidad_salida: 12.345,
  observaciones_salida: 'Carga completa',
};

describe('DTO de viajes', () => {
  describe('RegistrarSalidaViajeDto', () => {
    it('1. acepta un body válido', async () => {
      const dto = await validate(RegistrarSalidaViajeDto, salidaValida);
      expect(dto).toMatchObject(salidaValida);
    });

    it('2. rechaza un identificador incompatible con las FK integer', async () => {
      await expect(
        validate(RegistrarSalidaViajeDto, {
          ...salidaValida,
          proyecto_id: '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85',
        }),
      ).rejects.toThrow();
    });

    it('3. rechaza cantidad_salida igual a cero', async () => {
      await expect(
        validate(RegistrarSalidaViajeDto, {
          ...salidaValida,
          cantidad_salida: 0,
        }),
      ).rejects.toThrow();
    });

    it('4. rechaza cantidad_salida negativa', async () => {
      await expect(
        validate(RegistrarSalidaViajeDto, {
          ...salidaValida,
          cantidad_salida: -1,
        }),
      ).rejects.toThrow();
    });

    it('5. rechaza cantidad_salida con más de tres decimales', async () => {
      await expect(
        validate(RegistrarSalidaViajeDto, {
          ...salidaValida,
          cantidad_salida: 1.2345,
        }),
      ).rejects.toThrow();
    });

    it('6. rechaza cantidad_salida superior a numeric(12,3)', async () => {
      await expect(
        validate(RegistrarSalidaViajeDto, {
          ...salidaValida,
          cantidad_salida: 1_000_000_000,
        }),
      ).rejects.toThrow();
    });

    it('7. rechaza observaciones formadas solo por espacios', async () => {
      await expect(
        validate(RegistrarSalidaViajeDto, {
          ...salidaValida,
          observaciones_salida: '   ',
        }),
      ).rejects.toThrow();
    });

    it.each(['estado', 'checador_salida_id'])(
      '8. rechaza la propiedad no permitida %s',
      async (propiedad) => {
        await expect(
          validate(RegistrarSalidaViajeDto, {
            ...salidaValida,
            [propiedad]: propiedad === 'estado' ? 'en_transito' : 1,
          }),
        ).rejects.toThrow();
      },
    );
  });

  describe('RegistrarLlegadaViajeDto', () => {
    it('9. acepta un body vacío', async () => {
      await expect(validate(RegistrarLlegadaViajeDto, {})).resolves.toEqual({});
    });

    it.each([0, -1, 1.2345, 1_000_000_000])(
      '10. rechaza cantidad_llegada inválida: %s',
      async (cantidad_llegada) => {
        await expect(
          validate(RegistrarLlegadaViajeDto, { cantidad_llegada }),
        ).rejects.toThrow();
      },
    );

    it('11. rechaza observaciones formadas solo por espacios', async () => {
      await expect(
        validate(RegistrarLlegadaViajeDto, {
          observaciones_llegada: '   ',
        }),
      ).rejects.toThrow();
    });

    it.each([
      'estado',
      'fecha_hora_llegada',
      'checador_llegada',
      'administrador_cancelacion',
      'fecha_hora_cancelacion',
      'motivo_cancelacion',
      'creado_en',
      'actualizado_en',
    ])('rechaza el campo controlado por el servidor %s', async (campo) => {
      await expect(
        validate(RegistrarLlegadaViajeDto, {
          cantidad_llegada: 14.5,
          [campo]: 'valor-no-permitido',
        }),
      ).rejects.toThrow();
    });
  });

  describe('CancelarViajeDto', () => {
    it('12. acepta un motivo válido y elimina espacios extremos', async () => {
      const dto = await validate(CancelarViajeDto, {
        motivo_cancelacion: '  Falla mecánica  ',
      });
      expect(dto.motivo_cancelacion).toBe('Falla mecánica');
    });

    it('13. rechaza un motivo vacío', async () => {
      await expect(
        validate(CancelarViajeDto, { motivo_cancelacion: '   ' }),
      ).rejects.toThrow();
    });

    it('rechaza un motivo ausente', async () => {
      await expect(validate(CancelarViajeDto, {})).rejects.toThrow();
    });

    it('14. rechaza un motivo con menos de cinco caracteres', async () => {
      await expect(
        validate(CancelarViajeDto, { motivo_cancelacion: 'Falla' }),
      ).resolves.toBeInstanceOf(CancelarViajeDto);
      await expect(
        validate(CancelarViajeDto, { motivo_cancelacion: 'Mal' }),
      ).rejects.toThrow();
    });

    it.each(['estado', 'administrador_cancelacion', 'fecha_hora_cancelacion'])(
      'rechaza el campo controlado por el servidor %s',
      async (campo) => {
        await expect(
          validate(CancelarViajeDto, {
            motivo_cancelacion: 'Falla mecánica',
            [campo]: campo === 'estado' ? 'cancelado' : 1,
          }),
        ).rejects.toThrow();
      },
    );
  });

  describe('ConsultarViajesDto', () => {
    it('16. acepta un estado válido', async () => {
      const dto = await validate(
        ConsultarViajesDto,
        { estado: 'completado' },
        'query',
      );
      expect(dto.estado).toBe('completado');
    });

    it('17. rechaza un estado inválido', async () => {
      await expect(
        validate(ConsultarViajesDto, { estado: 'entregado' }, 'query'),
      ).rejects.toThrow();
    });

    it('18. rechaza un identificador de filtro inválido', async () => {
      await expect(
        validate(
          ConsultarViajesDto,
          { proyecto_id: '13a8a44c-9f8e-4f5e-b822-c1972ba1cb85' },
          'query',
        ),
      ).rejects.toThrow();
    });

    it('19. rechaza page menor que uno', async () => {
      await expect(
        validate(ConsultarViajesDto, { page: '0' }, 'query'),
      ).rejects.toThrow();
    });

    it('20. rechaza limit mayor que cien', async () => {
      await expect(
        validate(ConsultarViajesDto, { limit: '101' }, 'query'),
      ).rejects.toThrow();
    });

    it('21. transforma page y limit y aplica sus valores predeterminados', async () => {
      const transformado = await validate(
        ConsultarViajesDto,
        { page: '2', limit: '50' },
        'query',
      );
      expect(transformado.page).toBe(2);
      expect(transformado.limit).toBe(50);

      const defaults = await validate(ConsultarViajesDto, {}, 'query');
      expect(defaults.page).toBe(1);
      expect(defaults.limit).toBe(20);
    });
  });
});
