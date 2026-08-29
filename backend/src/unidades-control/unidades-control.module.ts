import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnidadControl } from './unidad-control.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { UnidadesControlController } from './unidades-control.controller';
import { UnidadesControlService } from './unidades-control.service';

@Module({
  imports: [TypeOrmModule.forFeature([UnidadControl]), AuditoriaModule],
  controllers: [UnidadesControlController],
  providers: [UnidadesControlService],
  exports: [TypeOrmModule],
})
export class UnidadesControlModule {}
