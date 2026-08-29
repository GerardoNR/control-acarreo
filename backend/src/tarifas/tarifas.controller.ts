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
import { CreateTarifaDto, UpdateTarifaDto } from './dto/tarifa.dto';
import { TarifasService } from './tarifas.service';
@Controller('tarifas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class TarifasController {
  constructor(private readonly service: TarifasService) {}
  @Get() listar() {
    return this.service.listar();
  }
  @Get(':id') obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }
  @Post() crear(
    @Body() dto: CreateTarifaDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.crear(dto, usuario);
  }
  @Patch(':id') editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTarifaDto,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.service.editar(id, dto, usuario);
  }
}
