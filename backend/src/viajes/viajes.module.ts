import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Viaje } from './viaje.entity';
import { ViajesController } from './viajes.controller';
import { ViajesService } from './viajes.service';
import { SuspensionesModule } from '../suspensiones/suspensiones.module';
import { TicketsModule } from '../tickets/tickets.module';
import { IncidenciasViajeModule } from '../incidencias-viaje/incidencias-viaje.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Viaje]),
    AuthModule,
    SuspensionesModule,
    TicketsModule,
    IncidenciasViajeModule,
  ],
  controllers: [ViajesController],
  providers: [ViajesService],
})
export class ViajesModule {}
