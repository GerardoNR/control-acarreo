import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { OrdenAcarreo } from './orden-acarreo.entity';
import { OrdenesAcarreoController } from './ordenes-acarreo.controller';
import { OrdenesAcarreoService } from './ordenes-acarreo.service';
@Module({
  imports: [TypeOrmModule.forFeature([OrdenAcarreo]), AuditoriaModule],
  controllers: [OrdenesAcarreoController],
  providers: [OrdenesAcarreoService],
})
export class OrdenesAcarreoModule {}
