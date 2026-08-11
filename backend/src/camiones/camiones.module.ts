import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camion } from './camion.entity';
import { CamionesController } from './camiones.controller';
import { CamionesService } from './camiones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Camion])],
  controllers: [CamionesController],
  providers: [CamionesService],
})
export class CamionesModule {}
