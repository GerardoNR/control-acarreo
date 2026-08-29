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
import { CambiarEstadoDto } from '../common/dto/cambiar-estado.dto';
import {
  CreateUnidadControlDto,
  ConsultarUnidadesControlDto,
  UpdateUnidadControlDto,
} from './dto/unidad-control.dto';
import { UnidadesControlService } from './unidades-control.service';

@Controller('unidades-control')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class UnidadesControlController {
  constructor(private readonly service: UnidadesControlService) {}
  @Get()
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  listar(@Query() filtros: ConsultarUnidadesControlDto) {
    return this.service.listar(filtros);
  }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }
  @Post() crear(
    @Body() dto: CreateUnidadControlDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.crear(dto, usuario);
  }
  @Patch(':id') editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUnidadControlDto,
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
