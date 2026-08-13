import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
