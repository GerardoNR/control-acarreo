import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Administrador } from '../administradores/administrador.entity';
import { Checador } from './checador.entity';
import { ChecadoresController } from './checadores.controller';
import { ChecadoresService } from './checadores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Checador, Administrador])],
  controllers: [ChecadoresController],
  providers: [ChecadoresService],
})
export class ChecadoresModule {}
