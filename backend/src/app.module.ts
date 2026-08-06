import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CamionesModule } from './camiones/camiones.module';
import { ChoferesModule } from './choferes/choferes.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { MaterialesModule } from './materiales/materiales.module';
import { UbicacionesModule } from './ubicaciones/ubicaciones.module';
import { ViajesModule } from './viajes/viajes.module';
import { AuditoriaModule } from './auditoria/auditoria.module';

@Module({
  imports: [AuthModule, UsuariosModule, CamionesModule, ChoferesModule, ProyectosModule, MaterialesModule, UbicacionesModule, ViajesModule, AuditoriaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
