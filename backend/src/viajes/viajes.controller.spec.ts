import {
  ArgumentMetadata,
  ExecutionContext,
  ParseUUIDPipe,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { RegistrarSalidaViajeDto } from './dto/registrar-salida-viaje.dto';
import { ViajesController } from './viajes.controller';
import { ViajesService } from './viajes.service';

describe('ViajesController - registrar salida', () => {
  const dto: RegistrarSalidaViajeDto = {
    proyecto_id: 1,
    material_id: 2,
    camion_id: 3,
    chofer_id: 4,
    ubicacion_origen_id: 5,
    ubicacion_destino_id: 6,
    cantidad_salida: 14.5,
  };
  const usuario: AuthUser = {
    id: 7,
    nombre: 'Checador Uno',
    usuario: 'checador1',
    rol: Role.CHECADOR,
  };

  it('delega al servicio el DTO y el usuario autenticado', async () => {
    const registrarSalida = jest.fn().mockResolvedValue({ id: 'viaje-id' });
    const controller = new ViajesController({
      registrarSalida,
    } as unknown as ViajesService);

    await expect(controller.registrarSalida(dto, usuario)).resolves.toEqual({
      id: 'viaje-id',
    });
    expect(registrarSalida).toHaveBeenCalledWith(dto, usuario);
  });

  it('protege el endpoint con JWT, RolesGuard y rol CHECADOR', () => {
    // Se requiere la referencia sin enlazar para leer los metadatos del decorador.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = ViajesController.prototype.registrarSalida;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    const roles = Reflect.getMetadata(ROLES_KEY, handler) as Role[];

    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    expect(roles).toEqual([Role.CHECADOR]);
  });

  it('RolesGuard deniega a un administrador', () => {
    // Se requiere la referencia sin enlazar para que Reflector lea @Roles().
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = ViajesController.prototype.registrarSalida;
    const context = {
      getHandler: () => handler,
      getClass: () => ViajesController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { ...usuario, rol: Role.ADMINISTRADOR },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(new RolesGuard(new Reflector()).canActivate(context)).toBe(false);
  });

  it.each(['estado', 'checador_salida_id'])(
    'rechaza la propiedad no permitida %s con el ValidationPipe global',
    async (propiedad) => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: RegistrarSalidaViajeDto,
      };

      await expect(
        pipe.transform({ ...dto, [propiedad]: 'valor' }, metadata),
      ).rejects.toThrow();
    },
  );

  it('14. ParseUUIDPipe rechaza un UUID inválido', async () => {
    await expect(
      new ParseUUIDPipe().transform('no-es-uuid', {
        type: 'param',
        data: 'id',
      }),
    ).rejects.toThrow();
  });

  it('20. declara la ruta NFC específica sin confundirla con /:id', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const nfc = ViajesController.prototype.consultarActivoPorNfc;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const porId = ViajesController.prototype.consultarPorId;
    expect(Reflect.getMetadata(PATH_METADATA, nfc)).toBe(
      'activo/camion/nfc/:uid',
    );
    expect(Reflect.getMetadata(PATH_METADATA, porId)).toBe(':id');
  });

  it.each(['consultar', 'consultarPorId', 'consultarActivoPorNfc'] as const)(
    '22-23. permite ADMINISTRADOR y CHECADOR en %s',
    (metodo) => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const handler = ViajesController.prototype[metodo];
      const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
      const roles = Reflect.getMetadata(ROLES_KEY, handler) as Role[];
      expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
      expect(roles).toEqual([Role.ADMINISTRADOR, Role.CHECADOR]);
    },
  );

  it('24. JwtAuthGuard rechaza la ausencia de usuario autenticado', () => {
    const guard = new JwtAuthGuard();
    expect(() =>
      // Passport define el retorno como any; aquí solo verificamos la excepción.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      guard.handleRequest(null, null, new UnauthorizedException()),
    ).toThrow(UnauthorizedException);
  });
});
