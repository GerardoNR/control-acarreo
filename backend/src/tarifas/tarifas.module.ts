import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { Tarifa } from './tarifa.entity';
import { TarifasController } from './tarifas.controller';
import { TarifasService } from './tarifas.service';
@Module({
  imports: [TypeOrmModule.forFeature([Tarifa]), AuditoriaModule],
  controllers: [TarifasController],
  providers: [TarifasService],
})
export class TarifasModule {}
