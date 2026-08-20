import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checador } from '../checadores/checador.entity';
import { Administrador } from './administrador.entity';
import { AdministradoresController } from './administradores.controller';
import { AdministradoresService } from './administradores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Administrador, Checador])],
  controllers: [AdministradoresController],
  providers: [AdministradoresService],
})
export class AdministradoresModule {}
