import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

describe('ReportesController', () => {
  it('delega la consulta del resumen al servicio', async () => {
    const resumen = jest.fn().mockResolvedValue({ viajes_totales: 2 });
    const controller = new ReportesController({
      resumen,
    } as unknown as ReportesService);

    await expect(controller.resumen()).resolves.toEqual({ viajes_totales: 2 });
    expect(resumen).toHaveBeenCalledTimes(1);
  });

  it('expone /resumen exclusivamente para ADMINISTRADOR', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = ReportesController.prototype.resumen;
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('resumen');
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      Role.ADMINISTRADOR,
    ]);
  });
});
