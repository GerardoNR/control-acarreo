import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Ubicacion } from './ubicacion.entity';
import { UbicacionesController } from './ubicaciones.controller';
import { UbicacionesService } from './ubicaciones.service';
import { PapeleraModule } from '../papelera/papelera.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ubicacion, Proyecto]), PapeleraModule],
  controllers: [UbicacionesController],
  providers: [UbicacionesService],
})
export class UbicacionesModule {}
