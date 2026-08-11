import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Administrador } from './administrador.entity';
import { AdministradoresController } from './administradores.controller';
import { AdministradoresService } from './administradores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Administrador])],
  controllers: [AdministradoresController],
  providers: [AdministradoresService],
})
export class AdministradoresModule {}
