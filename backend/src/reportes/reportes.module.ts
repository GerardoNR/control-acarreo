import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Viaje } from '../viajes/viaje.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ExcelReportService } from './excel-report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Viaje]), AuthModule],
  controllers: [ReportesController],
  providers: [ReportesService, ExcelReportService],
})
export class ReportesModule {}
