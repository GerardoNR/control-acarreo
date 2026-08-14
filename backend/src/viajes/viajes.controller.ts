import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CancelarViajeDto } from './dto/cancelar-viaje.dto';
import { RegistrarLlegadaViajeDto } from './dto/registrar-llegada-viaje.dto';
import { RegistrarSalidaViajeDto } from './dto/registrar-salida-viaje.dto';
import { ConsultarViajesDto } from './dto/consultar-viajes.dto';
import { ViajesService } from './viajes.service';

@Controller('viajes')
export class ViajesController {
  constructor(private readonly viajesService: ViajesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  consultar(@Query() filtros: ConsultarViajesDto) {
    return this.viajesService.consultar(filtros);
  }

  @Get('activo/camion/nfc/:uid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  consultarActivoPorNfc(@Param('uid') uid: string) {
    return this.viajesService.consultarActivoPorNfc(uid);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  consultarPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.viajesService.consultarPorId(id);
  }

  @Patch(':id/llegada')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHECADOR)
  registrarLlegada(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RegistrarLlegadaViajeDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.viajesService.registrarLlegada(id, dto, usuario);
  }

  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  cancelar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelarViajeDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.viajesService.cancelar(id, dto, usuario);
  }

  @Post('salida')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHECADOR)
  registrarSalida(
    @Body() dto: RegistrarSalidaViajeDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.viajesService.registrarSalida(dto, usuario);
  }
}
