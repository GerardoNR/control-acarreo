import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from './checador.entity';
import { ChecadoresController } from './checadores.controller';
import { ChecadoresService } from './checadores.service';
import { PapeleraModule } from '../papelera/papelera.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Checador, Administrador]),
    PapeleraModule,
    AuditoriaModule,
  ],
  controllers: [ChecadoresController],
  providers: [ChecadoresService],
})
export class ChecadoresModule {}
