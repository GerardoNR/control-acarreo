import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PapeleraController } from './papelera.controller';
import { PapeleraService } from './papelera.service';
import { SuspensionesModule } from '../suspensiones/suspensiones.module';

@Module({
  imports: [AuditoriaModule, SuspensionesModule],
  controllers: [PapeleraController],
  providers: [PapeleraService],
  exports: [PapeleraService],
})
export class PapeleraModule {}
