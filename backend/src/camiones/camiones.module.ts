import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camion } from './camion.entity';
import { CamionesController } from './camiones.controller';
import { CamionesService } from './camiones.service';
import { PapeleraModule } from '../papelera/papelera.module';

@Module({
  imports: [TypeOrmModule.forFeature([Camion]), PapeleraModule],
  controllers: [CamionesController],
  providers: [CamionesService],
})
export class CamionesModule {}
