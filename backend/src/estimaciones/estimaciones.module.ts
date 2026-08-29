import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { EstimacionDetalle } from './estimacion-detalle.entity';
import { Estimacion } from './estimacion.entity';
import { EstimacionesController } from './estimaciones.controller';
import { EstimacionesService } from './estimaciones.service';
import { PagoEstimacion } from './pago-estimacion.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Estimacion, EstimacionDetalle, PagoEstimacion]),
    AuditoriaModule,
  ],
  controllers: [EstimacionesController],
  providers: [EstimacionesService],
})
export class EstimacionesModule {}
