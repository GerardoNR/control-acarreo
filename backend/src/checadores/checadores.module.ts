import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checador } from './checador.entity';
import { ChecadoresController } from './checadores.controller';
import { ChecadoresService } from './checadores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Checador])],
  controllers: [ChecadoresController],
  providers: [ChecadoresService],
})
export class ChecadoresModule {}
