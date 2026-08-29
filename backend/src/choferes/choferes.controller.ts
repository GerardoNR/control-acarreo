import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CambiarEstadoDto } from '../common/dto/cambiar-estado.dto';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PapeleraService } from '../papelera/papelera.service';
import { ChoferesService } from './choferes.service';
import { CreateChoferDto } from './dto/create-chofer.dto';
import { UpdateChoferDto } from './dto/update-chofer.dto';

@Controller('choferes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
export class ChoferesController {
  constructor(
    private readonly choferesService: ChoferesService,
    private readonly papeleraService: PapeleraService,
  ) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findAll() {
    return this.choferesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.CHECADOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.choferesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChoferDto) {
    return this.choferesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChoferDto) {
    return this.choferesService.update(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.choferesService.cambiarEstado(id, dto.activo);
  }

  @Delete(':id')
  enviarPapelera(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthUser,
  ) {
    return this.papeleraService.enviar('chofer', id, usuario);
  }
}
