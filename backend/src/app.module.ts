import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdministradoresModule } from './administradores/administradores.module';
import { ChecadoresModule } from './checadores/checadores.module';
import { CamionesModule } from './camiones/camiones.module';
import { ChoferesModule } from './choferes/choferes.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { MaterialesModule } from './materiales/materiales.module';
import { UbicacionesModule } from './ubicaciones/ubicaciones.module';
import { ViajesModule } from './viajes/viajes.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { ReportesModule } from './reportes/reportes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PapeleraModule } from './papelera/papelera.module';
import { OrdenesAcarreoModule } from './ordenes-acarreo/ordenes-acarreo.module';
import { TarifasModule } from './tarifas/tarifas.module';
import { EstimacionesModule } from './estimaciones/estimaciones.module';
import { SuspensionesModule } from './suspensiones/suspensiones.module';
import { IncidenciasViajeModule } from './incidencias-viaje/incidencias-viaje.module';
import { RutasAcarreoModule } from './rutas-acarreo/rutas-acarreo.module';
import { TicketsModule } from './tickets/tickets.module';
import { UnidadesControlModule } from './unidades-control/unidades-control.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      // Supabase requiere SSL; los entornos locales seguros pueden desactivarlo.
      ssl:
        process.env.DATABASE_SSL === 'false'
          ? false
          : { rejectUnauthorized: false },
      // El esquema se administra exclusivamente mediante migraciones revisadas.
      synchronize: false,
    }),
    AuthModule,
    AdministradoresModule,
    ChecadoresModule,
    CamionesModule,
    ChoferesModule,
    ProyectosModule,
    MaterialesModule,
    UbicacionesModule,
    ViajesModule,
    AuditoriaModule,
    ReportesModule,
    DashboardModule,
    PapeleraModule,
    OrdenesAcarreoModule,
    TarifasModule,
    EstimacionesModule,
    SuspensionesModule,
    RutasAcarreoModule,
    UnidadesControlModule,
    TicketsModule,
    IncidenciasViajeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
