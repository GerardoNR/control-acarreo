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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      // Necesario para la conexión actual con PostgreSQL/Supabase.
      ssl: { rejectUnauthorized: false },
      // SOLO DESARROLLO.
      // Antes de producción usar migrations y synchronize: false.
      synchronize: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
