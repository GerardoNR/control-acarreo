import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CambiarEstadoDto } from '../common/dto/cambiar-estado.dto';
import {
  CreateRutaAcarreoDto,
  UpdateRutaAcarreoDto,
} from './dto/ruta-acarreo.dto';
import { RutasAcarreoService } from './rutas-acarreo.service';

@Controller('rutas-acarreo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class RutasAcarreoController {
  constructor(private readonly service: RutasAcarreoService) {}
  @Get() listar() {
    return this.service.listar();
  }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }
  @Post() crear(
    @Body() dto: CreateRutaAcarreoDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.crear(dto, usuario);
  }
  @Patch(':id') editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRutaAcarreoDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.editar(id, dto, usuario);
  }
  @Patch(':id/estado') cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.cambiarEstado(id, dto.activo, usuario);
  }
}
