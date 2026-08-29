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
  ConsultarOrdenesDto,
  CreateOrdenAcarreoDto,
  UpdateOrdenAcarreoDto,
} from './dto/orden-acarreo.dto';
import { OrdenesAcarreoService } from './ordenes-acarreo.service';

@Controller('ordenes-acarreo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class OrdenesAcarreoController {
  constructor(private readonly service: OrdenesAcarreoService) {}
  @Get() listar(@Query() filtros: ConsultarOrdenesDto) {
    return this.service.listar(filtros);
  }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }
  @Post() crear(
    @Body() dto: CreateOrdenAcarreoDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.crear(dto, usuario);
  }
  @Patch(':id') editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdenAcarreoDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.editar(id, dto, usuario);
  }
  @Patch(':id/cancelar') cancelar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.cancelar(id, usuario);
  }
}
