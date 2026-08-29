import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './proyecto.entity';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';
import { PapeleraModule } from '../papelera/papelera.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proyecto]),
    AuditoriaModule,
    PapeleraModule,
  ],
  controllers: [ProyectosController],
  providers: [ProyectosService],
})
export class ProyectosModule {}
