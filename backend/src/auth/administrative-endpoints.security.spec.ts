import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdministradoresController } from '../administradores/administradores.controller';
import { AdministradoresService } from '../administradores/administradores.service';
import { CamionesController } from '../camiones/camiones.controller';
import { CamionesService } from '../camiones/camiones.service';
import { ChecadoresController } from '../checadores/checadores.controller';
import { ChecadoresService } from '../checadores/checadores.service';
import { ChoferesController } from '../choferes/choferes.controller';
import { ChoferesService } from '../choferes/choferes.service';
import { MaterialesController } from '../materiales/materiales.controller';
import { MaterialesService } from '../materiales/materiales.service';
import { ProyectosController } from '../proyectos/proyectos.controller';
import { ProyectosService } from '../proyectos/proyectos.service';
import { UbicacionesController } from '../ubicaciones/ubicaciones.controller';
import { UbicacionesService } from '../ubicaciones/ubicaciones.service';
import { Role } from './enums/role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
class JwtAuthGuardDePrueba implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    const role = request.headers.authorization?.replace('Bearer ', '');

    if (role !== Role.ADMINISTRADOR && role !== Role.CHECADOR) {
      throw new UnauthorizedException();
    }

    request.user = {
      id: 1,
      nombre: 'Usuario de prueba',
      usuario: 'prueba',
      rol: role,
    };
    return true;
  }
}

const respuesta = { protegido: true };
const servicio = {
  findAll: jest.fn().mockReturnValue(respuesta),
  findOne: jest.fn().mockReturnValue(respuesta),
  findByNfc: jest.fn().mockReturnValue(respuesta),
  create: jest.fn().mockReturnValue(respuesta),
  update: jest.fn().mockReturnValue(respuesta),
  cambiarEstado: jest.fn().mockReturnValue(respuesta),
};

describe('Seguridad de endpoints administrativos', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ProyectosController,
        MaterialesController,
        CamionesController,
        ChoferesController,
        UbicacionesController,
        ChecadoresController,
        AdministradoresController,
      ],
      providers: [
        { provide: ProyectosService, useValue: servicio },
        { provide: MaterialesService, useValue: servicio },
        { provide: CamionesService, useValue: servicio },
        { provide: ChoferesService, useValue: servicio },
        { provide: UbicacionesService, useValue: servicio },
        { provide: ChecadoresService, useValue: servicio },
        { provide: AdministradoresService, useValue: servicio },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(JwtAuthGuardDePrueba)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe.each([
    'proyectos',
    'materiales',
    'camiones',
    'choferes',
    'ubicaciones',
  ])('catálogo %s', (ruta) => {
    it('GET sin JWT responde 401', () =>
      request(app.getHttpServer()).get(`/api/${ruta}`).expect(401));

    it.each([Role.CHECADOR, Role.ADMINISTRADOR])('GET permite a %s', (role) =>
      request(app.getHttpServer())
        .get(`/api/${ruta}`)
        .set('Authorization', `Bearer ${role}`)
        .expect(200, respuesta),
    );

    it('POST sin JWT responde 401', () =>
      request(app.getHttpServer()).post(`/api/${ruta}`).send({}).expect(401));

    it('POST responde 403 a CHECADOR', () =>
      request(app.getHttpServer())
        .post(`/api/${ruta}`)
        .set('Authorization', `Bearer ${Role.CHECADOR}`)
        .send({})
        .expect(403));

    it('POST permite a ADMINISTRADOR', () =>
      request(app.getHttpServer())
        .post(`/api/${ruta}`)
        .set('Authorization', `Bearer ${Role.ADMINISTRADOR}`)
        .send({})
        .expect(201, respuesta));
  });

  it.each([Role.CHECADOR, Role.ADMINISTRADOR])(
    'GET /api/camiones/nfc/:uid permite a %s',
    (role) =>
      request(app.getHttpServer())
        .get('/api/camiones/nfc/UID-PRUEBA')
        .set('Authorization', `Bearer ${role}`)
        .expect(200, respuesta),
  );

  describe.each(['checadores', 'administradores'])('gestión de %s', (ruta) => {
    it('GET sin JWT responde 401', () =>
      request(app.getHttpServer()).get(`/api/${ruta}`).expect(401));

    it('GET responde 403 a CHECADOR', () =>
      request(app.getHttpServer())
        .get(`/api/${ruta}`)
        .set('Authorization', `Bearer ${Role.CHECADOR}`)
        .expect(403));

    it('GET permite a ADMINISTRADOR', () =>
      request(app.getHttpServer())
        .get(`/api/${ruta}`)
        .set('Authorization', `Bearer ${Role.ADMINISTRADOR}`)
        .expect(200, respuesta));
  });
});
