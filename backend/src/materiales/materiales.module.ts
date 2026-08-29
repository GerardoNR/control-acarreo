import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './material.entity';
import { MaterialesController } from './materiales.controller';
import { MaterialesService } from './materiales.service';
import { PapeleraModule } from '../papelera/papelera.module';

@Module({
  imports: [TypeOrmModule.forFeature([Material]), PapeleraModule],
  controllers: [MaterialesController],
  providers: [MaterialesService],
})
export class MaterialesModule {}
