import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsultarViajesDto } from '../viajes/dto/consultar-viajes.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  resumen() {
    return this.reportesService.resumen();
  }

  @Get('viajes')
  viajes(@Query() filtros: ConsultarViajesDto) {
    return this.reportesService.viajes(filtros);
  }

  @Get('viajes/exportar/excel')
  async exportarExcel(
    @Query() filtros: ConsultarViajesDto,
    @Res() response: Response,
  ) {
    const archivo = await this.reportesService.exportarExcel(filtros);
    this.enviarArchivo(
      response,
      archivo,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xlsx',
    );
  }

  private enviarArchivo(
    response: Response,
    archivo: Buffer,
    contentType: string,
    extension: string,
  ) {
    const fecha = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Monterrey',
    }).format(new Date());
    response.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="INDI_Reporte_Viajes_${fecha}.${extension}"`,
      'Content-Length': archivo.length,
      'Cache-Control': 'private, no-store',
    });
    response.end(archivo);
  }
}
