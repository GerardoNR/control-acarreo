import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { Suspension } from './suspension.entity';
import { SuspensionesController } from './suspensiones.controller';
import { SuspensionesService } from './suspensiones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Suspension]), AuditoriaModule],
  controllers: [SuspensionesController],
  providers: [SuspensionesService],
  exports: [SuspensionesService],
})
export class SuspensionesModule {}
