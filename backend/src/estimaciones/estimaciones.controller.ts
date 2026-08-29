import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  CreateEstimacionDto,
  FacturarEstimacionDto,
  RegistrarPagoEstimacionDto,
} from './dto/estimacion.dto';
import { EstimacionesService } from './estimaciones.service';
@Controller('estimaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class EstimacionesController {
  constructor(private readonly service: EstimacionesService) {}
  @Get() listar() {
    return this.service.listar();
  }
  @Get('viajes-elegibles') elegibles(
    @Query('proyecto_id', ParseIntPipe) proyectoId: number,
    @Query('fecha_desde') desde: string,
    @Query('fecha_hasta') hasta: string,
    @Query('orden_acarreo_id') orden?: string,
  ) {
    return this.service.elegibles(
      proyectoId,
      desde,
      hasta,
      orden ? Number(orden) : undefined,
    );
  }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }
  @Post() crear(
    @Body() dto: CreateEstimacionDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.crear(dto, usuario);
  }
  @Patch(':id/cerrar') cerrar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.cerrar(id, usuario);
  }
  @Patch(':id/facturar') facturar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FacturarEstimacionDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.facturar(id, dto, usuario);
  }
  @Post(':id/pagos') pago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarPagoEstimacionDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.registrarPago(id, dto, usuario);
  }
}
