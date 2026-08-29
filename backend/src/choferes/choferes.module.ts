import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chofer } from './chofer.entity';
import { ChoferesController } from './choferes.controller';
import { ChoferesService } from './choferes.service';
import { PapeleraModule } from '../papelera/papelera.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chofer]), PapeleraModule],
  controllers: [ChoferesController],
  providers: [ChoferesService],
})
export class ChoferesModule {}
