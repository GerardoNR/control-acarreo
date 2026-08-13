import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Viaje } from './viaje.entity';
import { ViajesController } from './viajes.controller';
import { ViajesService } from './viajes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Viaje]), AuthModule],
  controllers: [ViajesController],
  providers: [ViajesService],
})
export class ViajesModule {}
