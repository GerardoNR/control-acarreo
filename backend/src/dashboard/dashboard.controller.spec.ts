import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Injectable()
class JwtAuthGuardDePrueba implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const httpRequest = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    const role = httpRequest.headers.authorization?.replace('Bearer ', '');
    if (role !== Role.ADMINISTRADOR && role !== Role.CHECADOR) {
      throw new UnauthorizedException();
    }
    httpRequest.user = {
      id: 1,
      nombre: 'Usuario de prueba',
      usuario: 'prueba',
      rol: role,
    };
    return true;
  }
}

describe('DashboardController', () => {
  const respuesta = {
    fecha_operativa: '2026-08-24',
    zona_horaria: 'America/Monterrey',
    viajes_hoy: 2,
    en_transito: 1,
    completados_hoy: 1,
    cancelados_hoy: 0,
    volumen_transportado: [{ unidad_medida: 'm3', cantidad: 14.5 }],
    actividad_ultimos_7_dias: [],
    volumen_ultimos_7_dias: [],
    operacion_actual: {
      viajes_en_transito: 1,
      camiones_operando: 1,
      proyectos_activos: 1,
    },
  };
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: { resumen: () => respuesta } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(JwtAuthGuardDePrueba)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => app.close());

  it('expone GET /api/dashboard/resumen sólo para ADMINISTRADOR', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = DashboardController.prototype.resumen;
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('resumen');
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      Role.ADMINISTRADOR,
    ]);
  });

  it('sin JWT responde 401', () =>
    request(app.getHttpServer()).get('/api/dashboard/resumen').expect(401));

  it('CHECADOR recibe 403', () =>
    request(app.getHttpServer())
      .get('/api/dashboard/resumen')
      .set('Authorization', `Bearer ${Role.CHECADOR}`)
      .expect(403));

  it('ADMINISTRADOR recibe la estructura esperada', () =>
    request(app.getHttpServer())
      .get('/api/dashboard/resumen')
      .set('Authorization', `Bearer ${Role.ADMINISTRADOR}`)
      .expect(200, respuesta));
});
