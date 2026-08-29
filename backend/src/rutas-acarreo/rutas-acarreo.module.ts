import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaAcarreo } from './ruta-acarreo.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { RutasAcarreoController } from './rutas-acarreo.controller';
import { RutasAcarreoService } from './rutas-acarreo.service';

@Module({
  imports: [TypeOrmModule.forFeature([RutaAcarreo]), AuditoriaModule],
  controllers: [RutasAcarreoController],
  providers: [RutasAcarreoService],
  exports: [TypeOrmModule],
})
export class RutasAcarreoModule {}
