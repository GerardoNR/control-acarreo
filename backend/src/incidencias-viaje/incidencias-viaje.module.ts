import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidenciaViaje } from './incidencia-viaje.entity';
import { IncidenciasViajeService } from './incidencias-viaje.service';

@Module({
  imports: [TypeOrmModule.forFeature([IncidenciaViaje])],
  providers: [IncidenciasViajeService],
  exports: [IncidenciasViajeService, TypeOrmModule],
})
export class IncidenciasViajeModule {}
